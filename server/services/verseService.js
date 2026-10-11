const path = require('path');
const fs = require('fs');
const db = require('../config/database');

let versesList = [];

function loadVerses() {
  const filePath = path.join(__dirname, '../data/verses.json');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    versesList = JSON.parse(content);
  } else {
    versesList = [];
  }
  return versesList;
}

function getTodayDateStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function initVerseService() {
  loadVerses();
  const todayStr = getTodayDateStr();
  const current = await db.getDailyVerseState();
  if (!current || current.date_str !== todayStr) {
    // Pick random verse for today
    await rollRandomVerse();
  }
}

async function getDailyVerse() {
  if (versesList.length === 0) {
    loadVerses();
  }
  const todayStr = getTodayDateStr();
  const current = await db.getDailyVerseState();
  if (current && current.date_str === todayStr) {
    return {
      date_str: current.date_str,
      verse: current.verse_data,
      custom_caption: current.custom_caption || '',
      image_path: current.image_path || null
    };
  }

  // If not yet set for today, roll one
  return await rollRandomVerse();
}

async function rollRandomVerse() {
  if (versesList.length === 0) {
    loadVerses();
  }

  const current = await db.getDailyVerseState();
  const todayStr = getTodayDateStr();

  let pool = versesList;
  if (current && current.verse_data && versesList.length > 1) {
    pool = versesList.filter(v => v.reference !== current.verse_data.reference);
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const selected = pool[randomIndex] || versesList[0];

  const newState = {
    date_str: todayStr,
    verse_data: selected,
    custom_caption: current ? current.custom_caption : '',
    image_path: current ? current.image_path : null
  };

  await db.saveDailyVerseState(newState);

  return {
    date_str: newState.date_str,
    verse: newState.verse_data,
    custom_caption: newState.custom_caption,
    image_path: newState.image_path
  };
}

function searchVerses(query = '') {
  if (versesList.length === 0) {
    loadVerses();
  }
  if (!query || query.trim() === '') {
    return versesList.slice(0, 30);
  }

  const q = query.toLowerCase().trim();
  return versesList.filter(v => 
    (v.text && v.text.toLowerCase().includes(q)) ||
    (v.reference && v.reference.toLowerCase().includes(q)) ||
    (v.book && v.book.toLowerCase().includes(q)) ||
    (v.theme && v.theme.toLowerCase().includes(q))
  );
}

async function setManualVerse(verseObj) {
  const current = await db.getDailyVerseState();
  const todayStr = getTodayDateStr();

  const formattedVerse = {
    id: verseObj.id || Date.now(),
    book: verseObj.book || '',
    chapter: verseObj.chapter || 1,
    verse: verseObj.verse || 1,
    reference: verseObj.reference || `${verseObj.book || 'Bíblia'} ${verseObj.chapter || 1}:${verseObj.verse || 1}`,
    text: verseObj.text || '',
    theme: verseObj.theme || 'Inspiracional'
  };

  const newState = {
    date_str: todayStr,
    verse_data: formattedVerse,
    custom_caption: current ? current.custom_caption : '',
    image_path: current ? current.image_path : null
  };

  await db.saveDailyVerseState(newState);

  return {
    date_str: newState.date_str,
    verse: newState.verse_data,
    custom_caption: newState.custom_caption,
    image_path: newState.image_path
  };
}

async function updateCustomCaption(caption) {
  const current = await db.getDailyVerseState();
  if (!current) {
    await rollRandomVerse();
  }
  const updated = await db.getDailyVerseState();
  updated.custom_caption = caption;
  await db.saveDailyVerseState(updated);
  return updated;
}

async function updateCustomImage(imagePath) {
  const current = await db.getDailyVerseState();
  if (!current) {
    await rollRandomVerse();
  }
  const updated = await db.getDailyVerseState();
  updated.image_path = imagePath;
  await db.saveDailyVerseState(updated);
  return updated;
}

module.exports = {
  loadVerses,
  initVerseService,
  getDailyVerse,
  rollRandomVerse,
  searchVerses,
  setManualVerse,
  updateCustomCaption,
  updateCustomImage
};
