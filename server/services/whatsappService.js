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

function broadcastStatus(state, data = {}) {
  connectionStatus.state = state;
  if (data.qrCode !== undefined) connectionStatus.qrCode = data.qrCode;
  if (data.user !== undefined) connectionStatus.user = data.user;

  if (ioInstance) {
    ioInstance.emit('connection_status', connectionStatus);
  }
}

function formatJid(input) {
  if (!input) return '';
  const clean = input.trim();
  if (clean.includes('@s.whatsapp.net') || clean.includes('@g.us')) {
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

async function initWhatsApp(io) {
  if (io) {
    ioInstance = io;
  }

  try {
    broadcastStatus('connecting');

    // Load auth state from Database (Supabase PostgreSQL / SQLite)
    const { state, saveCreds, clearSession } = await useDatabaseAuthState('default');
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: true }));

    const logger = pino({ level: 'silent' });

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

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      auth: state,
      browser: Browsers.macOS('Desktop'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      syncFullHistory: true,
      markOnlineOnConnect: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { scale: 8, margin: 2 });
          broadcastStatus('qr_ready', { qrCode: qrDataUrl, user: null });
        } catch (err) {
          console.error('Erro ao gerar imagem QR Code:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`Conexão Baileys encerrada (código: ${statusCode}). Reconectar: ${shouldReconnect}`);

        broadcastStatus('disconnected', { qrCode: null, user: null });

        if (shouldReconnect) {
          setTimeout(() => initWhatsApp(ioInstance), 3000);
        } else {
          // Desconectado explicitamente pelo usuário no celular - limpar sessão do Supabase/banco
          try {
            await clearSession();
          } catch (e) {
            console.error('Erro ao limpar sessão do banco:', e);
          }
        }
      } else if (connection === 'open') {
        console.log('✅ Conexão Baileys WhatsApp estabelecida com sucesso!');
        const user = {
          id: sock.user?.id ? sock.user.id.split(':')[0] : '',
          name: sock.user?.name || 'WhatsApp User'
        };
        broadcastStatus('connected', { qrCode: null, user });
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

    // Sincronizar contatos (upsert, set, updates e histórico)
    const handleAddContacts = async (contacts) => {
      if (!Array.isArray(contacts)) return;
      const batch = [];
      for (const c of contacts) {
        if (c.id && !c.id.includes('@g.us') && !c.id.includes('status@broadcast')) {
          const rawName = c.name || c.notify || c.verifiedName || contactsMap.get(c.id)?.name;
          const name = formatDisplayName(rawName, c.id);
          const obj = {
            jid: c.id,
            name,
            type: 'individual'
          };
          contactsMap.set(c.id, obj);
          batch.push(obj);
        }
      }
      if (batch.length > 0) {
        try {
          await db.autoUpsertRecipients(batch);
        } catch (e) {
          console.warn('Erro ao auto-salvar contatos no banco:', e.message);
        }
        broadcastContactsUpdate();
      }
    };

    sock.ev.on('contacts.upsert', handleAddContacts);
    sock.ev.on('contacts.set', ({ contacts }) => handleAddContacts(contacts));

    sock.ev.on('contacts.update', async (updates) => {
      const batch = [];
      for (const u of updates) {
        if (u.id && !u.id.includes('@g.us') && !u.id.includes('status@broadcast')) {
          const existing = contactsMap.get(u.id);
          const rawName = u.name || u.notify || u.verifiedName || existing?.name;
          const name = formatDisplayName(rawName, u.id);
          const obj = {
            jid: u.id,
            name,
            type: 'individual'
          };
          contactsMap.set(u.id, obj);
          batch.push(obj);
        }
      }
      if (batch.length > 0) {
        try {
          await db.autoUpsertRecipients(batch);
        } catch (e) {
          console.warn('Erro ao atualizar contatos no banco:', e.message);
        }
        broadcastContactsUpdate();
      }
    });

    sock.ev.on('messaging-history.set', async ({ contacts, chats }) => {
      if (contacts) await handleAddContacts(contacts);
      if (Array.isArray(chats)) {
        await handleChats(chats);
      }
    });

    // Sincronizar chats (para capturar conversas individuais e mapear grupos)
    const handleChats = async (chats) => {
      if (!Array.isArray(chats)) return;
      const batch = [];
      for (const chat of chats) {
        if (!chat.id || chat.id.includes('status@broadcast')) continue;
        if (chat.id.includes('@g.us')) {
          groupsMap.set(chat.id, {
            jid: chat.id,
            name: chat.name || chat.subject || 'Grupo do WhatsApp',
            type: 'group'
          });
        } else {
          // Chat individual
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
          console.warn('Erro ao auto-salvar chats no banco:', e.message);
        }
        broadcastContactsUpdate();
      }
    };

    sock.ev.on('chats.upsert', handleChats);
    sock.ev.on('chats.set', ({ chats }) => handleChats(chats));

    // Capturar contatos também de mensagens recebidas ou enviadas
    sock.ev.on('messages.upsert', async ({ messages }) => {
      if (!Array.isArray(messages)) return;
      const batch = [];
      for (const m of messages) {
        const jid = m.key?.remoteJid;
        if (jid && !jid.includes('@g.us') && !jid.includes('status@broadcast')) {
          if (!contactsMap.has(jid)) {
            const name = formatDisplayName(m.pushName, jid);
            const obj = { jid, name, type: 'individual' };
            contactsMap.set(jid, obj);
            batch.push(obj);
          }
        }
      }
      if (batch.length > 0) {
        try {
          await db.autoUpsertRecipients(batch);
        } catch (e) {
          console.warn('Erro ao auto-salvar contatos de mensagens:', e.message);
        }
        broadcastContactsUpdate();
      }
    });

    return sock;
  } catch (err) {
    console.error('Erro ao inicializar WhatsApp:', err);
    broadcastStatus('disconnected', { qrCode: null, user: null });
    return null;
  }
}

function broadcastContactsUpdate() {
  if (ioInstance) {
    const list = getContactsAndGroups();
    ioInstance.emit('contacts_synced', list);
  }
}

function getContactsAndGroups() {
  // Retorna apenas contatos individuais, ignorando grupos
  return Array.from(contactsMap.values());
}

async function sendMessage(jid, text, imagePath = null) {
  const formattedJid = formatJid(jid);

  // Trava de segurança máxima: NUNCA disparar mensagens em grupos
  if (formattedJid.includes('@g.us')) {
    console.log(`[Segurança Anti-Grupo] Ignorando envio para grupo: ${formattedJid}`);
    return { status: 'skipped', reason: 'group_blocked' };
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
  broadcastStatus,
  formatJid,
  formatMessagePayload,
  useDatabaseAuthState,
  initWhatsApp,
  getContactsAndGroups,
  sendMessage,
  logoutWhatsApp
};
