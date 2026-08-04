const db = require("../db");
const characters = require("./characters");
const vocabulary = require("./vocabulary");

function seed() {
  const existing = db.prepare("SELECT COUNT(*) as n FROM characters").get().n;
  if (existing > 0) {
    console.log(
      `Database already has ${existing} characters. Refusing to reseed (this would duplicate content or shift IDs that progress/vocabulary depend on).`
    );
    console.log("Delete data/canto.sqlite if you want a completely fresh start.");
    return;
  }

  const insertChar = db.prepare(`
    INSERT INTO characters (level, hanzi, jyutping, meanings, meaning_mnemonic, reading_mnemonic)
    VALUES (@level, @hanzi, @jyutping, @meanings, @meaningMnemonic, @readingMnemonic)
  `);
  const insertVocab = db.prepare(`
    INSERT INTO vocabulary (level, hanzi, jyutping, meanings, meaning_mnemonic, reading_mnemonic, character_ids)
    VALUES (@level, @hanzi, @jyutping, @meanings, @meaningMnemonic, @readingMnemonic, @characterIds)
  `);

  const insertAll = db.transaction(() => {
    for (const c of characters) {
      insertChar.run({
        level: c.level,
        hanzi: c.hanzi,
        jyutping: JSON.stringify(c.jyutping),
        meanings: JSON.stringify(c.meanings),
        meaningMnemonic: c.meaningMnemonic,
        readingMnemonic: c.readingMnemonic,
      });
    }
    for (const v of vocabulary) {
      insertVocab.run({
        level: v.level,
        hanzi: v.hanzi,
        jyutping: JSON.stringify(v.jyutping),
        meanings: JSON.stringify(v.meanings),
        meaningMnemonic: v.meaningMnemonic,
        readingMnemonic: v.readingMnemonic,
        characterIds: JSON.stringify(v.characterIds),
      });
    }
  });
  insertAll();

  console.log(`Seeded ${characters.length} characters and ${vocabulary.length} vocabulary words.`);
}

seed();
