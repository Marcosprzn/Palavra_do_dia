const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');

async function runTest() {
  console.log('--- Testing Express REST API & Server ---');

  const testDbDir = path.join(__dirname, '../data');
  const testDbPath = path.join(testDbDir, 'test_api.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  process.env.SQLITE_DB_PATH = testDbPath;
  delete process.env.DATABASE_URL;

  const { app, startServer } = require('../server/index');
  const PORT = 3099;

  const server = await startServer(PORT, false); // start without auto-connecting Baileys in unit test
  const baseUrl = `http://localhost:${PORT}`;

  try {
    // Helper fetch wrapper
    const request = async (urlPath, options = {}) => {
      const res = await fetch(`${baseUrl}${urlPath}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // 1. GET /api/status
    const statusRes = await request('/api/status');
    assert.strictEqual(statusRes.status, 200);
    assert.ok(statusRes.data.whatsapp, 'Should return whatsapp status');
    assert.ok(statusRes.data.scheduler, 'Should return scheduler status');
    console.log('✓ GET /api/status works');

    // 2. GET /api/verse
    const verseRes = await request('/api/verse');
    assert.strictEqual(verseRes.status, 200);
    assert.ok(verseRes.data.verse, 'Should return verse');
    console.log('✓ GET /api/verse works:', verseRes.data.verse.reference);

    // 3. POST /api/verse/roll
    const rollRes = await request('/api/verse/roll', { method: 'POST' });
    assert.strictEqual(rollRes.status, 200);
    assert.ok(rollRes.data.verse, 'Should return rolled verse');
    console.log('✓ POST /api/verse/roll works:', rollRes.data.verse.reference);

    // 4. GET /api/verse/search?q=amor
    const searchRes = await request('/api/verse/search?q=amor');
    assert.strictEqual(searchRes.status, 200);
    assert.ok(Array.isArray(searchRes.data), 'Should return array');
    console.log(`✓ GET /api/verse/search found ${searchRes.data.length} verses`);

    // 5. GET /api/schedule and POST /api/schedule
    const schedPost = await request('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ schedule_time: '06:30' })
    });
    assert.strictEqual(schedPost.status, 200);
    assert.strictEqual(schedPost.data.schedule_time, '06:30');

    const schedGet = await request('/api/schedule');
    assert.strictEqual(schedGet.status, 200);
    assert.strictEqual(schedGet.data.schedule_time, '06:30');
    console.log('✓ Schedule GET and POST endpoints work');

    // 6. POST /api/recipients and GET /api/recipients
    const saveRecipientsRes = await request('/api/recipients', {
      method: 'POST',
      body: JSON.stringify({
        recipients: [
          { jid: '5511988887777@s.whatsapp.net', name: 'Maria Souza', type: 'individual', active: 1 }
        ]
      })
    });
    assert.strictEqual(saveRecipientsRes.status, 200);

    const getRecipientsRes = await request('/api/recipients');
    assert.strictEqual(getRecipientsRes.status, 200);
    assert.ok(getRecipientsRes.data.some(r => r.jid === '5511988887777@s.whatsapp.net'));
    console.log('✓ Recipients endpoints work');

    // 7. GET /api/logs
    const logsRes = await request('/api/logs');
    assert.strictEqual(logsRes.status, 200);
    assert.ok(Array.isArray(logsRes.data));
    console.log('✓ Logs endpoint works');

    console.log('ALL API TESTS PASSED!');
  } finally {
    const schedulerService = require('../server/services/schedulerService');
    schedulerService.stopScheduler();
    const db = require('../server/config/database');
    await db.closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

runTest().catch((err) => {
  console.error('API Test Failed:', err);
  process.exit(1);
});
