const path = require('path');
const fs = require('fs');
const pino = require('pino');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

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
  // Strip non-digits
  const digits = clean.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

function formatMessagePayload(text, imagePath) {
  if (imagePath && fs.existsSync(imagePath)) {
    return {
      image: { url: imagePath },
      caption: text || ''
    };
  }
  return {
    text: text || ''
  };
}

async function initWhatsApp(io) {
  if (io) {
    ioInstance = io;
  }

  const sessionDir = process.env.SESSION_DATA_PATH || path.join(__dirname, '../../sessions');
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  try {
    broadcastStatus('connecting');

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: true }));

    const logger = pino({ level: 'silent' });

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      auth: state,
      browser: Browsers.macOS('Desktop'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { scale: 8, margin: 2 });
          broadcastStatus('qr_ready', { qrCode: qrDataUrl, user: null });
        } catch (err) {
          console.error('Error generating QR Code data URL:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`Baileys connection closed (status: ${statusCode}). Reconnect: ${shouldReconnect}`);

        broadcastStatus('disconnected', { qrCode: null, user: null });

        if (shouldReconnect) {
          setTimeout(() => initWhatsApp(ioInstance), 3000);
        } else {
          // Logged out - clear session directory
          try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
          } catch (e) {
            console.error('Error clearing session dir:', e);
          }
        }
      } else if (connection === 'open') {
        console.log('Baileys WhatsApp connection successfully opened!');
        const user = {
          id: sock.user?.id ? sock.user.id.split(':')[0] : '',
          name: sock.user?.name || 'WhatsApp User'
        };
        broadcastStatus('connected', { qrCode: null, user });
      }
    });

    // Sync contacts
    sock.ev.on('contacts.upsert', (contacts) => {
      for (const c of contacts) {
        if (c.id && !c.id.includes('@g.us')) {
          contactsMap.set(c.id, {
            jid: c.id,
            name: c.name || c.notify || c.verifiedName || c.id.split('@')[0],
            type: 'individual'
          });
        }
      }
      broadcastContactsUpdate();
    });

    sock.ev.on('contacts.update', (updates) => {
      for (const u of updates) {
        if (u.id && contactsMap.has(u.id)) {
          const existing = contactsMap.get(u.id);
          contactsMap.set(u.id, {
            ...existing,
            name: u.name || u.notify || u.verifiedName || existing.name
          });
        }
      }
      broadcastContactsUpdate();
    });

    // Sync groups
    sock.ev.on('chats.upsert', (chats) => {
      for (const chat of chats) {
        if (chat.id && chat.id.includes('@g.us')) {
          groupsMap.set(chat.id, {
            jid: chat.id,
            name: chat.name || chat.subject || 'Grupo do WhatsApp',
            type: 'group'
          });
        }
      }
      broadcastContactsUpdate();
    });

    return sock;
  } catch (err) {
    console.error('Error initializing WhatsApp socket:', err);
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
  const contacts = Array.from(contactsMap.values());
  const groups = Array.from(groupsMap.values());
  return [...groups, ...contacts];
}

async function sendMessage(jid, text, imagePath = null) {
  if (!sock) {
    throw new Error('WhatsApp não está conectado.');
  }
  const formattedJid = formatJid(jid);
  const payload = formatMessagePayload(text, imagePath);
  return await sock.sendMessage(formattedJid, payload);
}

async function logoutWhatsApp() {
  const sessionDir = process.env.SESSION_DATA_PATH || path.join(__dirname, '../../sessions');
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock.end();
      sock = null;
    }
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error('Error during WhatsApp logout:', err);
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
  initWhatsApp,
  getContactsAndGroups,
  sendMessage,
  logoutWhatsApp
};
