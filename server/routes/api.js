const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const db = require('../config/database');
const verseService = require('../services/verseService');
const whatsappService = require('../services/whatsappService');
const schedulerService = require('../services/schedulerService');

// Multer storage configuration
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'anexo-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagem inválido. Use JPG, PNG, WEBP ou GIF.'));
    }
  }
});

// 1. Status
router.get('/status', (req, res) => {
  res.json({
    whatsapp: whatsappService.getConnectionStatus(),
    scheduler: schedulerService.getSchedulerStatus()
  });
});

// 2. WhatsApp connection controls
router.post('/whatsapp/connect', async (req, res) => {
  try {
    await whatsappService.initWhatsApp();
    res.json({ success: true, message: 'Iniciando conexão com WhatsApp' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/logout', async (req, res) => {
  try {
    await whatsappService.logoutWhatsApp();
    res.json({ success: true, message: 'Desconectado do WhatsApp com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Verses
router.get('/verse', async (req, res) => {
  try {
    const daily = await verseService.getDailyVerse();
    res.json(daily);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verse/roll', async (req, res) => {
  try {
    const rolled = await verseService.rollRandomVerse();
    res.json(rolled);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verse/search', (req, res) => {
  try {
    const results = verseService.searchVerses(req.query.q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verse/select', async (req, res) => {
  try {
    const { verse } = req.body;
    if (!verse) {
      return res.status(400).json({ error: 'Versículo não informado.' });
    }
    const updated = await verseService.setManualVerse(verse);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verse/caption', async (req, res) => {
  try {
    const { caption } = req.body;
    const updated = await verseService.updateCustomCaption(caption || '');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Image Upload & Attachment
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    const relativePath = path.join('uploads', req.file.filename);
    const fullPath = req.file.path;

    await verseService.updateCustomImage(fullPath);

    res.json({
      success: true,
      filename: req.file.filename,
      filePath: fullPath,
      fileUrl: `/${relativePath.replace(/\\/g, '/')}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/upload', async (req, res) => {
  try {
    const current = await verseService.getDailyVerse();
    if (current && current.image_path) {
      if (fs.existsSync(current.image_path)) {
        try {
          fs.unlinkSync(current.image_path);
        } catch (e) {
          console.error('Erro ao deletar imagem antiga:', e);
        }
      }
    }
    await verseService.updateCustomImage(null);
    res.json({ success: true, message: 'Imagem removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configuração de Travar/Fixar Imagem Anexada
router.get('/settings/image-lock', async (req, res) => {
  try {
    const val = await db.getSetting('keep_image_attached', 'false');
    res.json({ keep_image_attached: val === 'true' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings/image-lock', async (req, res) => {
  try {
    const { keep_image_attached } = req.body;
    const strVal = keep_image_attached ? 'true' : 'false';
    await db.updateSetting('keep_image_attached', strVal);
    res.json({ success: true, keep_image_attached: keep_image_attached === true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Schedule
router.get('/schedule', async (req, res) => {
  try {
    const timeStr = await schedulerService.getScheduleTime();
    res.json({ schedule_time: timeStr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/schedule', async (req, res) => {
  try {
    const { schedule_time } = req.body;
    if (!schedule_time) {
      return res.status(400).json({ error: 'Horário de envio não informado.' });
    }
    const updatedTime = await schedulerService.updateScheduleTime(schedule_time);
    res.json({ success: true, schedule_time: updatedTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Recipients (merge WhatsApp synced + DB)
router.get('/recipients', async (req, res) => {
  try {
    const dbRecipients = await db.getRecipients();
    const waRecipients = whatsappService.getContactsAndGroups();

    const mergedMap = new Map();

    // Add saved DB recipients first
    for (const r of dbRecipients) {
      mergedMap.set(r.jid, {
        jid: r.jid,
        name: r.name,
        type: r.type,
        active: r.active === 1 || r.active === true
      });
    }

    // Merge or insert WhatsApp contacts
    for (const w of waRecipients) {
      if (!mergedMap.has(w.jid)) {
        mergedMap.set(w.jid, {
          jid: w.jid,
          name: w.name,
          type: w.type,
          active: false
        });
      }
    }

    // Filtra estritamente apenas contatos individuais (bloqueia grupos)
    const list = Array.from(mergedMap.values()).filter(
      r => r.type !== 'group' && !r.jid.includes('@g.us')
    );
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recipients', async (req, res) => {
  try {
    const { recipients } = req.body;
    if (!Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Lista de destinatários inválida.' });
    }
    await db.saveRecipients(recipients);
    res.json({ success: true, count: recipients.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Dispatch (Manual / Test Trigger)
router.post('/dispatch', async (req, res) => {
  try {
    if (schedulerService.isDispatching()) {
      return res.status(409).json({ error: 'Um disparo já está em andamento.' });
    }
    // Start dispatch asynchronously and return immediate 202
    schedulerService.dispatchToRecipients().catch(err => {
      console.error('Erro no disparo acionado via API:', err);
    });

    res.json({ success: true, message: 'Disparo iniciado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Send Logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await db.getSendLogs(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
