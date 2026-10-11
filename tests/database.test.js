const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTest() {
  console.log('--- Testing Dual Database Layer ---');
  
  // Clear any existing test sqlite database
  const testDbDir = path.join(__dirname, '../data');
  const testDbPath = path.join(testDbDir, 'test_palavra.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  process.env.SQLITE_DB_PATH = testDbPath;
  delete process.env.DATABASE_URL;

  const db = require('../server/config/database');
  
  await db.initDatabase();
  console.log('✓ Database initialized successfully');

  // Test Settings
  const settings = await db.getSettings();
  assert.strictEqual(settings.schedule_time, '06:00', 'Default schedule_time should be 06:00');
  console.log('✓ Default settings verified (schedule_time: 06:00)');

  await db.updateSetting('schedule_time', '07:30');
  const updatedSettings = await db.getSettings();
  assert.strictEqual(updatedSettings.schedule_time, '07:30', 'Schedule time should be updated to 07:30');
  console.log('✓ Settings update verified');

  // Test Recipients
  const testRecipients = [
    { jid: '5511999999999@s.whatsapp.net', name: 'João Silva', type: 'individual', active: 1 },
    { jid: '5511888888888@s.whatsapp.net', name: 'Ana Costa', type: 'individual', active: 1 },
    { jid: '120363024567890123@g.us', name: 'Grupo Família', type: 'group', active: 1 },
    { jid: '123456789@lid', name: 'Admin Grupo', type: 'individual', active: 1 }
  ];
  await db.saveRecipients(testRecipients);
  const recipients = await db.getRecipients();
  assert.strictEqual(recipients.length, 2, 'Should only save and fetch 2 valid individual recipients');
  assert.strictEqual(recipients[0].name, 'Ana Costa');
  assert.strictEqual(recipients[1].name, 'João Silva');
  
  // Test deleteRecipient
  await db.deleteRecipient('5511888888888@s.whatsapp.net');
  const remainingRecipients = await db.getRecipients();
  assert.strictEqual(remainingRecipients.length, 1);
  assert.strictEqual(remainingRecipients[0].name, 'João Silva');
  console.log('✓ Recipients save, fetch, filter and delete verified');

  // Test Send Logs
  await db.logSend({
    recipient_jid: '5511999999999@s.whatsapp.net',
    recipient_name: 'João Silva',
    verse_text: 'O Senhor é o meu pastor; nada me faltará.',
    verse_ref: 'Salmos 23:1',
    has_image: 1,
    status: 'success',
    error_message: null
  });

  const logs = await db.getSendLogs(10);
  assert.strictEqual(logs.length, 1, 'Should have 1 send log entry');
  assert.strictEqual(logs[0].status, 'success');
  console.log('✓ Send logs verified');

  // Cleanup test db
  await db.closeDatabase();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('ALL DATABASE TESTS PASSED!');
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
