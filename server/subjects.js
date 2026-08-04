const db = require("./db");

function parseCharacter(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: "character",
    level: row.level,
    hanzi: row.hanzi,
    jyutping: JSON.parse(row.jyutping),
    meanings: JSON.parse(row.meanings),
    meaningMnemonic: row.meaning_mnemonic,
    readingMnemonic: row.reading_mnemonic,
  };
}

function parseVocabulary(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: "vocabulary",
    level: row.level,
    hanzi: row.hanzi,
    jyutping: JSON.parse(row.jyutping),
    meanings: JSON.parse(row.meanings),
    meaningMnemonic: row.meaning_mnemonic,
    readingMnemonic: row.reading_mnemonic,
    characterIds: JSON.parse(row.character_ids),
  };
}

function parseExpression(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: "expression",
    level: row.level,
    hanzi: row.hanzi,
    jyutping: JSON.parse(row.jyutping),
    meanings: JSON.parse(row.meanings),
    meaningMnemonic: row.meaning_mnemonic,
    readingMnemonic: row.reading_mnemonic,
    characterIds: JSON.parse(row.character_ids),
  };
}

function getProgress(subjectType, subjectId) {
  return db
    .prepare(
      "SELECT * FROM progress WHERE subject_type = ? AND subject_id = ?"
    )
    .get(subjectType, subjectId);
}

function getOrCreateProgress(subjectType, subjectId) {
  let p = getProgress(subjectType, subjectId);
  if (!p) {
    db.prepare(
      `INSERT INTO progress (subject_type, subject_id, srs_stage, unlocked_at)
       VALUES (?, ?, 0, datetime('now'))`
    ).run(subjectType, subjectId);
    p = getProgress(subjectType, subjectId);
  }
  return p;
}

function allCharacters() {
  return db.prepare("SELECT * FROM characters ORDER BY level, id").all().map(parseCharacter);
}

function allVocabulary() {
  return db.prepare("SELECT * FROM vocabulary ORDER BY level, id").all().map(parseVocabulary);
}

function allExpressions() {
  return db.prepare("SELECT * FROM expressions ORDER BY level, id").all().map(parseExpression);
}

function getCharacter(id) {
  return parseCharacter(db.prepare("SELECT * FROM characters WHERE id = ?").get(id));
}

function getVocabulary(id) {
  return parseVocabulary(db.prepare("SELECT * FROM vocabulary WHERE id = ?").get(id));
}

function getExpression(id) {
  return parseExpression(db.prepare("SELECT * FROM expressions WHERE id = ?").get(id));
}

const GETTERS = {
  character: getCharacter,
  vocabulary: getVocabulary,
  expression: getExpression,
};

function getSubject(type, id) {
  const getter = GETTERS[type];
  return getter ? getter(id) : null;
}

module.exports = {
  parseCharacter,
  parseVocabulary,
  parseExpression,
  getProgress,
  getOrCreateProgress,
  allCharacters,
  allVocabulary,
  allExpressions,
  getCharacter,
  getVocabulary,
  getExpression,
  getSubject,
};
