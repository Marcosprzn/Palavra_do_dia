const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTest() {
  console.log('--- Testing Verse Service ---');

  const testDbDir = path.join(__dirname, '../data');
  const testDbPath = path.join(testDbDir, 'test_verse.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  process.env.SQLITE_DB_PATH = testDbPath;
  delete process.env.DATABASE_URL;

  const db = require('../server/config/database');
  await db.initDatabase();

  const verseService = require('../server/services/verseService');
  await verseService.initVerseService();

  // 1. Test getDailyVerse
  const daily = await verseService.getDailyVerse();
  assert.ok(daily, 'Daily verse should exist');
  assert.ok(daily.verse, 'Daily verse object should exist');
  assert.ok(daily.verse.text, 'Verse should have text');
  assert.ok(daily.verse.reference, 'Verse should have reference');
  console.log('✓ getDailyVerse returned:', daily.verse.reference);

  // 2. Test rollRandomVerse
  const rolled = await verseService.rollRandomVerse();
  assert.ok(rolled, 'Rolled verse should exist');
  assert.ok(rolled.verse.text, 'Rolled verse should have text');
  console.log('✓ rollRandomVerse returned:', rolled.verse.reference);

  // 3. Test searchVerses
  const searchResults = verseService.searchVerses('paz');
  assert.ok(Array.isArray(searchResults), 'Search result should be an array');
  assert.ok(searchResults.length > 0, 'Search for "paz" should return results');
  console.log(`✓ searchVerses found ${searchResults.length} verses for "paz"`);

  // 4. Test setManualVerse
  const customVerse = {
    book: 'Filipenses',
    chapter: 4,
    verse: 13,
    reference: 'Filipenses 4:13',
    text: 'Tudo posso naquele que me fortalece.'
  };
  const setVerse = await verseService.setManualVerse(customVerse);
  assert.strictEqual(setVerse.verse.reference, 'Filipenses 4:13');
  console.log('✓ setManualVerse verified');

  // 5. Test updateCustomCaption & updateCustomImage
  await verseService.updateCustomCaption('Bom dia abençoado a todos!');
  await verseService.updateCustomImage('uploads/exemplo.jpg');
  const stateAfterUpdates = await verseService.getDailyVerse();
  assert.strictEqual(stateAfterUpdates.custom_caption, 'Bom dia abençoado a todos!');
  assert.strictEqual(stateAfterUpdates.image_path, 'uploads/exemplo.jpg');
  console.log('✓ Custom caption and image updates verified');

  // Cleanup
  await db.closeDatabase();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('ALL VERSE SERVICE TESTS PASSED!');
}

runTest().catch((err) => {
  console.error('Verse Service Test Failed:', err);
  process.exit(1);
});
