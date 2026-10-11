const fs = require('fs');
const path = require('path');

let sqliteDb = null;
let pgPool = null;
let isPostgres = false;

function getDb() {
  if (isPostgres) return pgPool;
  return sqliteDb;
}

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim() !== '') {
    isPostgres = true;
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipients (
        jid VARCHAR(255) PRIMARY KEY,
        name TEXT,
        type VARCHAR(50) DEFAULT 'individual',
        active INTEGER DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS send_logs (
        id SERIAL PRIMARY KEY,
        recipient_jid VARCHAR(255),
        recipient_name TEXT,
        verse_text TEXT,
        verse_ref VARCHAR(100),
        has_image INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_verse_state (
        id VARCHAR(50) PRIMARY KEY,
        date_str VARCHAR(20) NOT NULL,
        verse_data JSONB NOT NULL,
        custom_caption TEXT,
        image_path TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default settings if not exists
    await pgPool.query(`
      INSERT INTO settings (key, value)
      VALUES ('schedule_time', '06:00')
      ON CONFLICT (key) DO NOTHING;
    `);

  } else {
    isPostgres = false;
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../data/palavra.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    sqliteDb = new DatabaseSync(dbPath);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipients (
        jid TEXT PRIMARY KEY,
        name TEXT,
        type TEXT DEFAULT 'individual',
        active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS send_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_jid TEXT,
        recipient_name TEXT,
        verse_text TEXT,
        verse_ref TEXT,
        has_image INTEGER DEFAULT 0,
        status TEXT DEFAULT 'success',
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_verse_state (
        id TEXT PRIMARY KEY,
        date_str TEXT NOT NULL,
        verse_data TEXT NOT NULL,
        custom_caption TEXT,
        image_path TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Default settings
    const checkStmt = sqliteDb.prepare("SELECT value FROM settings WHERE key = 'schedule_time'");
    const existing = checkStmt.get();
    if (!existing) {
      const insertStmt = sqliteDb.prepare("INSERT INTO settings (key, value) VALUES ('schedule_time', '06:00')");
      insertStmt.run();
    }
  }

  return { isPostgres };
}

async function getSettings() {
  if (isPostgres) {
    const res = await pgPool.query('SELECT key, value FROM settings');
    const settings = {};
    for (const row of res.rows) {
      settings[row.key] = row.value;
    }
    return settings;
  } else {
    const stmt = sqliteDb.prepare('SELECT key, value FROM settings');
    const rows = stmt.all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }
}

async function updateSetting(key, value) {
  if (isPostgres) {
    await pgPool.query(`
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [key, value]);
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
  }
}

async function getRecipients() {
  if (isPostgres) {
    const res = await pgPool.query('SELECT * FROM recipients ORDER BY name ASC');
    return res.rows;
  } else {
    const stmt = sqliteDb.prepare('SELECT * FROM recipients ORDER BY name ASC');
    return stmt.all();
  }
}

async function saveRecipients(list) {
  if (isPostgres) {
    for (const item of list) {
      await pgPool.query(`
        INSERT INTO recipients (jid, name, type, active, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (jid) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          active = EXCLUDED.active,
          updated_at = NOW()
      `, [item.jid, item.name || '', item.type || 'individual', item.active !== undefined ? item.active : 1]);
    }
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO recipients (jid, name, type, active, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (jid) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        active = excluded.active,
        updated_at = CURRENT_TIMESTAMP
    `);
    for (const item of list) {
      stmt.run(item.jid, item.name || '', item.type || 'individual', item.active !== undefined ? item.active : 1);
    }
  }
}

async function logSend(entry) {
  if (isPostgres) {
    await pgPool.query(`
      INSERT INTO send_logs (recipient_jid, recipient_name, verse_text, verse_ref, has_image, status, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      entry.recipient_jid,
      entry.recipient_name || '',
      entry.verse_text || '',
      entry.verse_ref || '',
      entry.has_image ? 1 : 0,
      entry.status || 'success',
      entry.error_message || null
    ]);
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO send_logs (recipient_jid, recipient_name, verse_text, verse_ref, has_image, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.recipient_jid,
      entry.recipient_name || '',
      entry.verse_text || '',
      entry.verse_ref || '',
      entry.has_image ? 1 : 0,
      entry.status || 'success',
      entry.error_message || null
    );
  }
}

async function getSendLogs(limit = 50) {
  if (isPostgres) {
    const res = await pgPool.query('SELECT * FROM send_logs ORDER BY id DESC LIMIT $1', [limit]);
    return res.rows;
  } else {
    const stmt = sqliteDb.prepare('SELECT * FROM send_logs ORDER BY id DESC LIMIT ?');
    return stmt.all(limit);
  }
}

async function getDailyVerseState() {
  if (isPostgres) {
    const res = await pgPool.query("SELECT * FROM daily_verse_state WHERE id = 'current'");
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      date_str: row.date_str,
      verse_data: typeof row.verse_data === 'string' ? JSON.parse(row.verse_data) : row.verse_data,
      custom_caption: row.custom_caption,
      image_path: row.image_path
    };
  } else {
    const stmt = sqliteDb.prepare("SELECT * FROM daily_verse_state WHERE id = 'current'");
    const row = stmt.get();
    if (!row) return null;
    return {
      date_str: row.date_str,
      verse_data: JSON.parse(row.verse_data),
      custom_caption: row.custom_caption,
      image_path: row.image_path
    };
  }
}

async function saveDailyVerseState({ date_str, verse_data, custom_caption, image_path }) {
  const verseJson = typeof verse_data === 'string' ? verse_data : JSON.stringify(verse_data);
  if (isPostgres) {
    await pgPool.query(`
      INSERT INTO daily_verse_state (id, date_str, verse_data, custom_caption, image_path, updated_at)
      VALUES ('current', $1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET
        date_str = EXCLUDED.date_str,
        verse_data = EXCLUDED.verse_data,
        custom_caption = EXCLUDED.custom_caption,
        image_path = EXCLUDED.image_path,
        updated_at = NOW()
    `, [date_str, verseJson, custom_caption || null, image_path || null]);
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO daily_verse_state (id, date_str, verse_data, custom_caption, image_path, updated_at)
      VALUES ('current', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        date_str = excluded.date_str,
        verse_data = excluded.verse_data,
        custom_caption = excluded.custom_caption,
        image_path = excluded.image_path,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(date_str, verseJson, custom_caption || null, image_path || null);
  }
}

async function closeDatabase() {
  if (isPostgres && pgPool) {
    await pgPool.end();
    pgPool = null;
  } else if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}

module.exports = {
  getDb,
  initDatabase,
  getSettings,
  updateSetting,
  getRecipients,
  saveRecipients,
  logSend,
  getSendLogs,
  getDailyVerseState,
  saveDailyVerseState,
  closeDatabase
};
