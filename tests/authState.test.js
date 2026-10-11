const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { BufferJSON, initAuthCreds, proto } = require('@whiskeysockets/baileys');

async function runTest() {
  console.log('--- Testing Supabase / Database Baileys Auth State ---');

  const testDbDir = path.join(__dirname, '../data');
  const testDbPath = path.join(testDbDir, 'test_auth.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  process.env.SQLITE_DB_PATH = testDbPath;
  delete process.env.DATABASE_URL;

  const db = require('../server/config/database');
  await db.initDatabase();

  const whatsappService = require('../server/services/whatsappService');

  // Test useDatabaseAuthState
  const { state, saveCreds, clearSession } = await whatsappService.useDatabaseAuthState('test-session');
  assert.ok(state.creds, 'Should have initialized creds');
  assert.ok(state.keys, 'Should have keys adapter');
  console.log('✓ useDatabaseAuthState initialized');

  // Test saving and retrieving creds
  await saveCreds();
  const rawCreds = await db.getSessionKey('test-session', 'creds');
  assert.ok(rawCreds, 'Creds should be persisted in database');
  console.log('✓ Creds persisted in database');

  // Test saving keys
  await state.keys.set({
    'pre-key': {
      '1': { keyPair: { public: Buffer.from('test-pub'), private: Buffer.from('test-priv') } }
    }
  });

  const retrievedKeys = await state.keys.get('pre-key', ['1']);
  assert.ok(retrievedKeys['1'], 'Should retrieve pre-key 1');
  assert.ok(Buffer.isBuffer(retrievedKeys['1'].keyPair.public), 'Public key should be a Buffer');
  console.log('✓ Keys persisted and revived with Buffers');

  // Test clearSession
  await clearSession();
  const clearedCreds = await db.getSessionKey('test-session', 'creds');
  assert.strictEqual(clearedCreds, null, 'Creds should be deleted after clearSession');
  console.log('✓ clearSession successfully wiped database session');

  await db.closeDatabase();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('ALL AUTH STATE TESTS PASSED!');
}

runTest().catch((err) => {
  console.error('Auth State Test Failed:', err);
  process.exit(1);
});
