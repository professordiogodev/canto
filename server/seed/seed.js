const db = require("../db");
const characters = require("./characters");
const vocabulary = require("./vocabulary");
const expressions = require("./expressions");

// Every entry's `hanzi` is just its component characters written back to
// back (Chinese text has no spaces), so the characters a word/expression
// "uses" can always be derived by splitting its hanzi string and looking
// each one up — no manual id bookkeeping required.
function characterIdsFor(hanzi, hanziMap) {
  const seen = new Set();
  const ids = [];
  for (const ch of Array.from(hanzi)) {
    const id = hanziMap[ch];
    if (id !== undefined && !seen.has(ch)) {
      seen.add(ch);
      ids.push(id);
    }
  }
  return ids;
}

// Inserts only the rows beyond what's already in the table, so re-running
// this after pulling new levels adds the new content without touching (or
// duplicating) anything already seeded — existing SRS progress is untouched
// because it's keyed by subject_id, and ids are stable as long as entries
// are only ever appended to these files, never reordered or removed.
function seedAdditively(tableName, items, insertOne) {
  const existingCount = db.prepare(`SELECT COUNT(*) as n FROM ${tableName}`).get().n;
  if (existingCount >= items.length) {
    console.log(`${tableName}: already has ${existingCount} rows, nothing new to add.`);
    return;
  }
  const toInsert = items.slice(existingCount);
  const run = db.transaction(() => {
    for (const item of toInsert) insertOne(item);
  });
  run();
  console.log(
    `${tableName}: inserted ${toInsert.length} new row(s) (had ${existingCount}, now ${existingCount + toInsert.length}).`
  );
}

function seed() {
  const insertChar = db.prepare(`
    INSERT INTO characters (level, hanzi, jyutping, meanings, meaning_mnemonic, reading_mnemonic)
    VALUES (@level, @hanzi, @jyutping, @meanings, @meaningMnemonic, @readingMnemonic)
  `);
  seedAdditively("characters", characters, (c) =>
    insertChar.run({
      level: c.level,
      hanzi: c.hanzi,
      jyutping: JSON.stringify(c.jyutping),
      meanings: JSON.stringify(c.meanings),
      meaningMnemonic: c.meaningMnemonic,
      readingMnemonic: c.readingMnemonic,
    })
  );

  // Built after characters are inserted/confirmed so vocab and expressions
  // can resolve character_ids regardless of whether this is a fresh seed or
  // an incremental one.
  const hanziMap = {};
  for (const row of db.prepare("SELECT id, hanzi FROM characters").all()) {
    hanziMap[row.hanzi] = row.id;
  }

  const insertVocab = db.prepare(`
    INSERT INTO vocabulary (level, hanzi, jyutping, meanings, meaning_mnemonic, reading_mnemonic, character_ids)
    VALUES (@level, @hanzi, @jyutping, @meanings, @meaningMnemonic, @readingMnemonic, @characterIds)
  `);
  seedAdditively("vocabulary", vocabulary, (v) =>
    insertVocab.run({
      level: v.level,
      hanzi: v.hanzi,
      jyutping: JSON.stringify(v.jyutping),
      meanings: JSON.stringify(v.meanings),
      meaningMnemonic: v.meaningMnemonic,
      readingMnemonic: v.readingMnemonic,
      characterIds: JSON.stringify(characterIdsFor(v.hanzi, hanziMap)),
    })
  );

  const insertExpression = db.prepare(`
    INSERT INTO expressions (level, hanzi, jyutping, meanings, meaning_mnemonic, reading_mnemonic, character_ids)
    VALUES (@level, @hanzi, @jyutping, @meanings, @meaningMnemonic, @readingMnemonic, @characterIds)
  `);
  seedAdditively("expressions", expressions, (e) =>
    insertExpression.run({
      level: e.level,
      hanzi: e.hanzi,
      jyutping: JSON.stringify(e.jyutping),
      meanings: JSON.stringify(e.meanings),
      meaningMnemonic: e.meaningMnemonic,
      readingMnemonic: e.readingMnemonic,
      characterIds: JSON.stringify(characterIdsFor(e.hanzi, hanziMap)),
    })
  );
}

seed();
