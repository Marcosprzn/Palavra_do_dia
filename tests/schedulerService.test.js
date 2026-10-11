const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTest() {
  console.log('--- Testing Scheduler & Queue Dispatcher ---');

  const testDbDir = path.join(__dirname, '../data');
  const testDbPath = path.join(testDbDir, 'test_scheduler.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  process.env.SQLITE_DB_PATH = testDbPath;
  delete process.env.DATABASE_URL;

  const db = require('../server/config/database');
  await db.initDatabase();

  const verseService = require('../server/services/verseService');
  await verseService.initVerseService();

  const schedulerService = require('../server/services/schedulerService');

  // 1. Test cron pattern generator
  assert.strictEqual(schedulerService.cronPatternFromTime('06:00'), '0 6 * * *');
  assert.strictEqual(schedulerService.cronPatternFromTime('07:30'), '30 7 * * *');
  assert.strictEqual(schedulerService.cronPatternFromTime('23:59'), '59 23 * * *');
  console.log('✓ cronPatternFromTime works for all time formats');

  // 2. Test initScheduler & schedule update
  const mockIo = {
    events: [],
    emit(event, data) {
      this.events.push({ event, data });
    }
  };

  await schedulerService.initScheduler(mockIo);
  const initialTime = await schedulerService.getScheduleTime();
  assert.strictEqual(initialTime, '06:00');
  console.log('✓ Default schedule time verified: 06:00');

  await schedulerService.updateScheduleTime('08:00');
  const updatedTime = await schedulerService.getScheduleTime();
  assert.strictEqual(updatedTime, '08:00');
  console.log('✓ Schedule time successfully updated to: 08:00');

  // 3. Test dispatchToRecipients
  // Setup test recipients
  await db.saveRecipients([
    { jid: '5511999990001@s.whatsapp.net', name: 'Destinatário 1', type: 'individual', active: 1 },
    { jid: '5511999990002@s.whatsapp.net', name: 'Destinatário 2', type: 'individual', active: 1 },
    { jid: '5511999990003@s.whatsapp.net', name: 'Inativo', type: 'individual', active: 0 }
  ]);

  const sentMessages = [];
  const mockSendFn = async (jid, text, imagePath) => {
    sentMessages.push({ jid, text, imagePath });
    return { status: 'sent' };
  };

  console.log('Testing dispatch to active recipients with fast test delay...');
  const dispatchResult = await schedulerService.dispatchToRecipients({
    sendFn: mockSendFn,
    minDelayMs: 10,
    maxDelayMs: 20
  });

  assert.strictEqual(dispatchResult.total, 2, 'Should only send to 2 active recipients');
  assert.strictEqual(dispatchResult.success, 2, 'Both active recipients should succeed');
  assert.strictEqual(sentMessages.length, 2, 'Should have sent exactly 2 messages');
  console.log('✓ dispatchToRecipients sent to active recipients and skipped inactive ones');

  // Verify send_logs in database
  const logs = await db.getSendLogs(10);
  assert.strictEqual(logs.length, 2, 'Database should contain 2 send logs');
  console.log('✓ Logs stored in database');

  // Stop cron
  schedulerService.stopScheduler();

  // Cleanup
  await db.closeDatabase();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('ALL SCHEDULER TESTS PASSED!');
}

runTest().catch((err) => {
  console.error('Scheduler Test Failed:', err);
  process.exit(1);
});
