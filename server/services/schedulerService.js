const fs = require('fs');
const cron = require('node-cron');
const db = require('../config/database');
const verseService = require('./verseService');
const whatsappService = require('./whatsappService');

let cronTask = null;
let ioInstance = null;
let currentlyDispatching = false;
let currentScheduleTime = '06:00';

function setSocketIo(io) {
  ioInstance = io;
}

function isDispatching() {
  return currentlyDispatching;
}

function cronPatternFromTime(timeStr) {
  if (!timeStr || !timeStr.includes(':')) {
    return '0 6 * * *';
  }
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;
  return `${minute} ${hour} * * *`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatMessageText(daily) {
  const parts = [];
  const customCaption = (daily.custom_caption || '').trim();

  // Saudação matinal "Bom dia!"
  const hasCustomBomDia = /^bom\s*dia/i.test(customCaption);
  if (!hasCustomBomDia) {
    parts.push('☀️ *Bom dia!*');
    parts.push('');
  }

  if (customCaption !== '') {
    parts.push(customCaption);
    parts.push('');
  }

  if (daily.verse) {
    parts.push(`📖 *${daily.verse.reference}*`);
    parts.push(`"${daily.verse.text}"`);
    parts.push('');
  }

  parts.push('✨ _Palavra do Dia_');
  return parts.join('\n');
}

async function dispatchToRecipients(options = {}) {
  if (currentlyDispatching) {
    throw new Error('Um disparo já está em andamento no momento.');
  }

  currentlyDispatching = true;
  const sendFn = options.sendFn || ((jid, text, img) => whatsappService.sendMessage(jid, text, img));
  const minDelayMs = options.minDelayMs !== undefined ? options.minDelayMs : 3000;
  const maxDelayMs = options.maxDelayMs !== undefined ? options.maxDelayMs : 7000;

  try {
    const allRecipients = await db.getRecipients();
    const activeRecipients = allRecipients.filter(
      r => (r.active === 1 || r.active === true) && r.type !== 'group' && !r.jid.includes('@g.us')
    );
    const total = activeRecipients.length;

    if (total === 0) {
      if (ioInstance) {
        ioInstance.emit('dispatch_status', { message: 'Nenhum destinatário ativo selecionado.', total: 0 });
      }
      return { total: 0, success: 0, failed: 0 };
    }

    const daily = await verseService.getDailyVerse();
    const messageText = formatMessageText(daily);
    const imagePath = daily.image_path || null;

    let successCount = 0;
    let failedCount = 0;

    if (ioInstance) {
      ioInstance.emit('dispatch_start', { total, verse: daily.verse });
    }

    for (let i = 0; i < total; i++) {
      const recipient = activeRecipients[i];
      let sendStatus = 'success';
      let sendError = null;

      try {
        await sendFn(recipient.jid, messageText, imagePath);
        successCount++;
      } catch (err) {
        console.error(`Erro ao enviar para ${recipient.name || recipient.jid}:`, err);
        sendStatus = 'failed';
        sendError = err.message || 'Falha no envio';
        failedCount++;
      }

      // Log outcome in database
      await db.logSend({
        recipient_jid: recipient.jid,
        recipient_name: recipient.name || 'Desconhecido',
        verse_text: daily.verse ? daily.verse.text : '',
        verse_ref: daily.verse ? daily.verse.reference : '',
        has_image: imagePath ? 1 : 0,
        status: sendStatus,
        error_message: sendError
      });

      // Emit progress to frontend
      if (ioInstance) {
        ioInstance.emit('dispatch_progress', {
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          currentRecipient: recipient.name || recipient.jid,
          status: sendStatus
        });
      }

      // Humanized anti-ban delay (if not last item)
      if (i < total - 1 && maxDelayMs > 0) {
        const delay = randomBetween(minDelayMs, maxDelayMs);
        await sleep(delay);
      }
    }

    // Exclusão automática da imagem após disparo se a opção "travar imagem" estiver desativada
    const keepImageAttached = (await db.getSetting('keep_image_attached', 'false')) === 'true';
    if (!keepImageAttached && imagePath) {
      console.log('🗑️ Opção de fixar imagem está DESATIVADA: Excluindo imagem anexada após o envio...');
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error('Erro ao deletar arquivo de imagem após envio:', err);
      }
      await verseService.updateCustomImage(null);
      if (ioInstance) {
        ioInstance.emit('image_auto_removed', { message: 'Imagem do dia excluída automaticamente após o envio.' });
      }
    }

    const summary = { total, success: successCount, failed: failedCount };
    if (ioInstance) {
      ioInstance.emit('dispatch_complete', summary);
    }
    return summary;
  } finally {
    currentlyDispatching = false;
  }
}

async function initScheduler(io) {
  if (io) {
    ioInstance = io;
  }

  const settings = await db.getSettings();
  currentScheduleTime = settings.schedule_time || '06:00';
  setupCronJob(currentScheduleTime);
}

function setupCronJob(timeStr) {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }

  const cronPattern = cronPatternFromTime(timeStr);
  console.log(`Configurando agendador diário para ${timeStr} (cron: "${cronPattern}")...`);

  cronTask = cron.schedule(cronPattern, async () => {
    console.log(`⏰ Executando disparo agendado das ${timeStr}...`);
    try {
      await dispatchToRecipients();
    } catch (err) {
      console.error('Erro na execução do disparo agendado:', err);
    }
  });

  if (ioInstance) {
    ioInstance.emit('scheduler_status', { schedule_time: timeStr });
  }
}

async function updateScheduleTime(timeStr) {
  currentScheduleTime = timeStr;
  await db.updateSetting('schedule_time', timeStr);
  setupCronJob(timeStr);
  return currentScheduleTime;
}

async function getScheduleTime() {
  const settings = await db.getSettings();
  return settings.schedule_time || currentScheduleTime || '06:00';
}

function getSchedulerStatus() {
  return {
    schedule_time: currentScheduleTime,
    isDispatching: currentlyDispatching
  };
}

function stopScheduler() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}

module.exports = {
  setSocketIo,
  isDispatching,
  cronPatternFromTime,
  dispatchToRecipients,
  initScheduler,
  updateScheduleTime,
  getScheduleTime,
  getSchedulerStatus,
  stopScheduler,
  formatMessageText
};
