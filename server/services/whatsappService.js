const path = require('path');
const fs = require('fs');
const pino = require('pino');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  BufferJSON,
  initAuthCreds,
  proto
} = require('@whiskeysockets/baileys');

const db = require('../config/database');

let sock = null;
let ioInstance = null;
let isInitializing = false;
const qrEvents = new (require('events').EventEmitter)();
let connectionStatus = {
  state: 'disconnected', // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
  qrCode: null,
  user: null
};

// In-memory cache of synced contacts & groups
const contactsMap = new Map();
const groupsMap = new Map();

function setSocketIo(io) {
  ioInstance = io;
}

function getConnectionStatus() {
  return connectionStatus;
}

function waitForQrCode(timeoutMs = 12000) {
  if (connectionStatus.state === 'qr_ready' && connectionStatus.qrCode) {
    return Promise.resolve(connectionStatus.qrCode);
  }
  if (connectionStatus.state === 'connected') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      qrEvents.removeListener('qr', onQr);
      qrEvents.removeListener('connected', onConnected);
    };

    const onQr = (qr) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve(qr);
      }
    };

    const onConnected = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve(null);
      }
    };

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(connectionStatus.qrCode || null);
      }
    }, timeoutMs);

    qrEvents.once('qr', onQr);
    qrEvents.once('connected', onConnected);
  });
}

function broadcastStatus(state, data = {}) {
  connectionStatus.state = state;
  if (data.qrCode !== undefined) connectionStatus.qrCode = data.qrCode;
  if (data.user !== undefined) connectionStatus.user = data.user;

  if (ioInstance) {
    ioInstance.emit('connection_status', connectionStatus);
  }
}

function isRealIndividualUser(jid, selfJid = null) {
  if (!jid || typeof jid !== 'string') return false;
  const clean = jid.trim();
  if (!clean.endsWith('@s.whatsapp.net')) return false;
  if (
    clean.includes('@lid') ||
    clean.includes('@newsletter') ||
    clean.includes('@g.us') ||
    clean.includes('broadcast')
  ) {
    return false;
  }
  const digits = clean.replace(/@.*$/, '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 16) return false;
  if (selfJid) {
    const cleanSelf = selfJid.split(':')[0].replace(/@.*$/, '').replace(/\D/g, '');
    if (cleanSelf && digits === cleanSelf) return false;
  }
  return true;
}

function formatJid(input) {
  if (!input) return '';
  const clean = input.trim();
  if (clean.includes('@s.whatsapp.net') || clean.includes('@g.us') || clean.includes('@lid') || clean.includes('@newsletter')) {
    return clean;
  }
  const digits = clean.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

function formatMessagePayload(text, imagePath) {
  if (imagePath && (fs.existsSync(imagePath) || imagePath.startsWith('http') || imagePath.startsWith('data:'))) {
    return {
      image: { url: imagePath },
      caption: text || ''
    };
  }
  return {
    text: text || ''
  };
}

/**
 * Custom Auth State Adapter for Database Storage (Supabase PostgreSQL / SQLite)
 * Keeps WhatsApp authenticated across Render.com restarts and re-deployments!
 */
async function useDatabaseAuthState(sessionId = 'default') {
  const credsRaw = await db.getSessionKey(sessionId, 'creds');
  let creds;
  if (credsRaw) {
    try {
      creds = JSON.parse(credsRaw, BufferJSON.reviver);
    } catch (e) {
      console.error('Erro ao ler credenciais salvas do banco, inicializando novas:', e);
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              const raw = await db.getSessionKey(sessionId, `${type}-${id}`);
              if (raw) {
                try {
                  let value = JSON.parse(raw, BufferJSON.reviver);
                  if (type === 'app-state-sync-key' && value) {
                    value = proto.Message.AppStateSyncKeyData.fromObject(value);
                  }
                  data[id] = value;
                } catch (e) {
                  console.error(`Erro ao decodificar chave ${type}-${id}:`, e);
                }
              }
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const keyId = `${category}-${id}`;
              if (value) {
                const serialized = JSON.stringify(value, BufferJSON.replacer);
                tasks.push(db.setSessionKey(sessionId, keyId, serialized));
              } else {
                tasks.push(db.deleteSessionKey(sessionId, keyId));
              }
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      const serialized = JSON.stringify(creds, BufferJSON.replacer);
      await db.setSessionKey(sessionId, 'creds', serialized);
    },
    clearSession: async () => {
      await db.clearSession(sessionId);
    }
  };
}

async function initWhatsApp(io, forceNew = false) {
  if (io) {
    ioInstance = io;
  }

  if (isInitializing) {
    console.log('initWhatsApp já está inicializando, aguardando processo atual...');
    return sock;
  }
  isInitializing = true;

  try {
    broadcastStatus('connecting');

    // Se já houver um socket rodando, encerra antes de recriar
    if (sock) {
      try {
        const oldSock = sock;
        sock = null;
        oldSock.ev.removeAllListeners();
        oldSock.end();
      } catch (e) {
        console.warn('Aviso ao finalizar socket anterior:', e.message);
      }
    }

    // Se solicitado forceNew (gerar novo QR Code), limpa credenciais antigas do banco
    if (forceNew) {
      console.log('🔄 Limpando sessão anterior do Supabase para gerar novo QR Code...');
      try {
        await db.clearSession('default');
      } catch (e) {
        console.warn('Erro ao limpar sessão antiga:', e.message);
      }
    }

    // Load auth state from Database (Supabase PostgreSQL / SQLite)
    const { state, saveCreds, clearSession } = await useDatabaseAuthState('default');

    // Proteção com timeout de 3s contra travamento no fetchLatestBaileysVersion
    const versionPromise = fetchLatestBaileysVersion();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
    const { version } = await Promise.race([versionPromise, timeoutPromise])
      .catch(() => ({ version: [2, 3000, 1043857760], isLatest: true }));

    console.log(`[WhatsApp] Usando versão do Baileys: ${version.join('.')}`);
    const logger = pino({ level: 'warn' });

    // Carregar contatos salvos no banco de dados previamente
    try {
      const savedInDb = await db.getRecipients();
      for (const r of savedInDb) {
        if (r.jid && !r.jid.includes('@g.us')) {
          contactsMap.set(r.jid, {
            jid: r.jid,
            name: r.name || r.jid.split('@')[0],
            type: 'individual'
          });
        }
      }
    } catch (e) {
      console.warn('Aviso ao carregar contatos salvos do banco:', e.message);
    }

    // Configuração com Ubuntu Chrome permite syncFullHistory sem erro 428
    const currentSocket = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: true,
      shouldSyncHistoryMessage: () => true,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      markOnlineOnConnect: true
    });
    sock = currentSocket;

    currentSocket.ev.on('creds.update', saveCreds);

    currentSocket.ev.on('connection.update', async (update) => {
      // Ignorar eventos caso este socket tenha sido substituído
      if (sock !== currentSocket) {
        return;
      }

      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('[WhatsApp] 📌 Novo QR Code emitido pelo Baileys! Gerando imagem DataURL...');
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { scale: 8, margin: 2 });
          broadcastStatus('qr_ready', { qrCode: qrDataUrl, user: null });
          qrEvents.emit('qr', qrDataUrl);
          console.log('[WhatsApp] ✅ QR Code pronto e transmitido aos clientes via Socket/HTTP.');
        } catch (err) {
          console.error('[WhatsApp] ❌ Erro ao gerar imagem QR Code:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403;
        console.log(`[WhatsApp] 🔌 Conexão encerrada (código: ${statusCode || 'desconhecido'}). Deslogado: ${isLoggedOut}`);

        if (sock === currentSocket) {
          broadcastStatus('disconnected', { qrCode: null, user: null });
        }

        if (isLoggedOut) {
          console.log('[WhatsApp] 🗑️ Sessão revogada ou desconectada pelo app. Limpando credenciais do banco...');
          try {
            await clearSession();
          } catch (e) {
            console.error('[WhatsApp] Erro ao limpar sessão do banco:', e);
          }
        } else if (sock === currentSocket) {
          console.log('[WhatsApp] ⏳ Queda temporária. Agendando tentativa de reconexão em 3s...');
          setTimeout(() => {
            if (sock === currentSocket) {
              initWhatsApp(ioInstance, false);
            }
          }, 3000);
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp] ✅ Conexão WhatsApp autenticada e aberta com sucesso!');
        const user = {
          id: currentSocket.user?.id ? currentSocket.user.id.split(':')[0] : '',
          name: currentSocket.user?.name || 'WhatsApp User'
        };
        broadcastStatus('connected', { qrCode: null, user });
        qrEvents.emit('connected');
      }
    });

    // Função utilitária para formatar nome exibível de contato
    function formatDisplayName(name, jid) {
      if (name && name.trim() !== '' && name !== jid) {
        return name.trim();
      }
      const digits = (jid || '').replace(/@.*$/, '').replace(/\D/g, '');
      if (digits.length >= 10) {
        if (digits.startsWith('55') && digits.length >= 12) {
          const ddd = digits.slice(2, 4);
          const rest = digits.slice(4);
          if (rest.length === 9) {
            return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
          } else if (rest.length === 8) {
            return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
          }
        }
        return `+${digits}`;
      }
      return digits || 'Contato';
    }

    // Sincronizar contatos (upsert, set, updates e histórico da agenda)
    const handleAddContacts = async (contacts) => {
      if (!Array.isArray(contacts)) return;
      const selfJid = currentSocket.user?.id;
      const batch = [];
      for (const c of contacts) {
        let jid = c.id;
        if (c.jid && c.jid.includes('@s.whatsapp.net')) {
          jid = c.jid;
        } else if (c.phoneNumber) {
          jid = `${c.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
        }
        if (!isRealIndividualUser(jid, selfJid)) {
          continue;
        }

        const rawName = c.name || c.notify || c.verifiedName || contactsMap.get(jid)?.name;
        const name = formatDisplayName(rawName, jid);
        const obj = {
          jid,
          name,
          type: 'individual'
        };
        contactsMap.set(jid, obj);
        batch.push(obj);
      }
      if (batch.length > 0) {
        try {
          await db.autoUpsertRecipients(batch);
        } catch (e) {
          console.warn('[WhatsApp] Erro ao auto-salvar contatos no banco:', e.message);
        }
        broadcastContactsUpdate();
      }
    };

    currentSocket.ev.on('contacts.upsert', handleAddContacts);
    currentSocket.ev.on('contacts.set', ({ contacts }) => handleAddContacts(contacts));

    currentSocket.ev.on('contacts.update', async (updates) => {
      const selfJid = currentSocket.user?.id;
      const batch = [];
      for (const u of updates) {
        let jid = u.id;
        if (u.jid && u.jid.includes('@s.whatsapp.net')) {
          jid = u.jid;
        } else if (u.phoneNumber) {
          jid = `${u.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;
        }
        if (!isRealIndividualUser(jid, selfJid)) continue;
        const existing = contactsMap.get(jid);
        const rawName = u.name || u.notify || u.verifiedName || existing?.name;
        const name = formatDisplayName(rawName, jid);
        const obj = {
          jid,
          name,
          type: 'individual'
        };
        contactsMap.set(jid, obj);
        batch.push(obj);
      }
      if (batch.length > 0) {
        try {
          await db.autoUpsertRecipients(batch);
        } catch (e) {
          console.warn('[WhatsApp] Erro ao atualizar contatos no banco:', e.message);
        }
        broadcastContactsUpdate();
      }
    });

    // Sincronizar conversas (normais, fixadas e arquivadas)
    const handleChats = async (chats) => {
      if (!Array.isArray(chats)) return;
      const selfJid = currentSocket.user?.id;
      const batch = [];
      for (const chat of chats) {
        if (!chat.id || chat.id.includes('status@broadcast')) continue;
        if (chat.id.includes('@g.us')) {
          groupsMap.set(chat.id, {
            jid: chat.id,
            name: chat.name || chat.subject || 'Grupo do WhatsApp',
            type: 'group'
          });
        } else if (isRealIndividualUser(chat.id, selfJid)) {
          // Chat individual válido (contatos salvos e conversas normais/arquivadas)
          const existing = contactsMap.get(chat.id);
          const rawName = chat.name || chat.notify || existing?.name;
          const name = formatDisplayName(rawName, chat.id);
          const obj = {
            jid: chat.id,
            name,
            type: 'individual'
          };
          contactsMap.set(chat.id, obj);
          batch.push(obj);
        }
      }
      if (batch.length > 0) {
        try {
          await db.autoUpsertRecipients(batch);
        } catch (e) {
          console.warn('[WhatsApp] Erro ao auto-salvar conversas no banco:', e.message);
        }
        broadcastContactsUpdate();
      }
    };

    currentSocket.ev.on('chats.upsert', handleChats);
    currentSocket.ev.on('chats.set', ({ chats }) => handleChats(chats));
    currentSocket.ev.on('chats.update', handleChats);

    currentSocket.ev.on('messaging-history.set', async ({ contacts, chats, isLatest, syncType }) => {
      console.log(`[WhatsApp] 📥 Histórico recebido: ${contacts?.length || 0} contatos da agenda, ${chats?.length || 0} conversas ativas/arquivadas`);
      if (contacts) await handleAddContacts(contacts);
      if (Array.isArray(chats)) {
        await handleChats(chats);
      }
    });

    // Atualizar pushName se recebido, mas nunca criar destinatários de grupos/LIDs em messages.upsert
    currentSocket.ev.on('messages.upsert', async ({ messages }) => {
      if (!Array.isArray(messages)) return;
      const selfJid = currentSocket.user?.id;
      let updated = false;
      for (const m of messages) {
        const jid = m.key?.remoteJid;
        if (isRealIndividualUser(jid, selfJid) && contactsMap.has(jid)) {
          const existing = contactsMap.get(jid);
          if (m.pushName && (!existing.name || existing.name === jid || existing.name.startsWith('+'))) {
            existing.name = formatDisplayName(m.pushName, jid);
            contactsMap.set(jid, existing);
            updated = true;
          }
        }
      }
      if (updated) {
        broadcastContactsUpdate();
      }
    });

    return sock;
  } catch (err) {
    console.error('Erro ao inicializar WhatsApp:', err);
    broadcastStatus('disconnected', { qrCode: null, user: null });
    return null;
  } finally {
    isInitializing = false;
  }
}

function broadcastContactsUpdate() {
  if (ioInstance) {
    const list = getContactsAndGroups();
    ioInstance.emit('contacts_synced', list);
  }
}

function getContactsAndGroups() {
  // Retorna apenas contatos individuais com JID real válido
  return Array.from(contactsMap.values()).filter(c => isRealIndividualUser(c.jid));
}

async function sendMessage(jid, text, imagePath = null) {
  const formattedJid = formatJid(jid);

  // Trava de segurança máxima: NUNCA disparar mensagens em grupos
  if (formattedJid.includes('@g.us')) {
    console.log(`[Segurança Anti-Grupo] Ignorando envio para grupo: ${formattedJid}`);
    return { status: 'skipped', reason: 'group_blocked' };
  }

  // Trava de segurança: NUNCA disparar para canais, newsletters ou LIDs anônimos
  if (!isRealIndividualUser(formattedJid)) {
    console.log(`[Segurança] Ignorando envio para destinatário não individual/inválido: ${formattedJid}`);
    return { status: 'skipped', reason: 'invalid_recipient_blocked' };
  }

  if (!sock) {
    throw new Error('WhatsApp não está conectado.');
  }

  const payload = formatMessagePayload(text, imagePath);
  return await sock.sendMessage(formattedJid, payload);
}

async function logoutWhatsApp() {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock.end();
      sock = null;
    }
    // Remove session data from Database (Supabase PostgreSQL / SQLite)
    await db.clearSession('default');
  } catch (err) {
    console.error('Erro ao deslogar WhatsApp:', err);
  } finally {
    contactsMap.clear();
    groupsMap.clear();
    broadcastStatus('disconnected', { qrCode: null, user: null });
  }
}

module.exports = {
  setSocketIo,
  getConnectionStatus,
  waitForQrCode,
  broadcastStatus,
  formatJid,
  isRealIndividualUser,
  formatMessagePayload,
  useDatabaseAuthState,
  initWhatsApp,
  getContactsAndGroups,
  sendMessage,
  logoutWhatsApp
};
