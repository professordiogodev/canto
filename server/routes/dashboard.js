const express = require("express");
const db = require("../db");
const { computeCurrentLevel, GURU_STAGE } = require("../levels");

const router = express.Router();

router.get("/", (req, res) => {
  const currentLevel = computeCurrentLevel();

  const lessonsAvailable = db
    .prepare(
      `
    SELECT
      (SELECT COUNT(*) FROM characters c
        LEFT JOIN progress p ON p.subject_type = 'character' AND p.subject_id = c.id
        WHERE c.level <= ? AND (p.id IS NULL OR p.srs_stage = 0)) +
      (SELECT COUNT(*) FROM vocabulary v
        LEFT JOIN progress p ON p.subject_type = 'vocabulary' AND p.subject_id = v.id
        WHERE v.level <= ? AND (p.id IS NULL OR p.srs_stage = 0)) +
      (SELECT COUNT(*) FROM expressions e
        LEFT JOIN progress p ON p.subject_type = 'expression' AND p.subject_id = e.id
        WHERE e.level <= ? AND (p.id IS NULL OR p.srs_stage = 0)) as n
  `
    )
    .get(currentLevel, currentLevel, currentLevel).n;

  const reviewsAvailable = db
    .prepare(
      `SELECT COUNT(*) as n FROM progress
       WHERE srs_stage BETWEEN 1 AND 8 AND available_at IS NOT NULL AND available_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
    .get().n;

  const nextReviewAt = db
    .prepare(
      `SELECT MIN(available_at) as t FROM progress
       WHERE srs_stage BETWEEN 1 AND 8 AND available_at IS NOT NULL AND available_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
    .get().t;

  const levelChars = db
    .prepare("SELECT id FROM characters WHERE level = ?")
    .all(currentLevel);
  const levelVocab = db
    .prepare("SELECT id FROM vocabulary WHERE level = ?")
    .all(currentLevel);
  const levelExpressions = db
    .prepare("SELECT id FROM expressions WHERE level = ?")
    .all(currentLevel);

  const guruStmt = db.prepare(
    `SELECT COUNT(*) as n FROM progress WHERE subject_type = ? AND subject_id = ? AND srs_stage >= ?`
  );
  const startedStmt = db.prepare(
    `SELECT COUNT(*) as n FROM progress WHERE subject_type = ? AND subject_id = ? AND srs_stage >= 1`
  );

  let charsGuru = 0;
  let charsStarted = 0;
  for (const c of levelChars) {
    if (guruStmt.get("character", c.id, GURU_STAGE).n > 0) charsGuru++;
    if (startedStmt.get("character", c.id).n > 0) charsStarted++;
  }
  let vocabStarted = 0;
  for (const v of levelVocab) {
    if (startedStmt.get("vocabulary", v.id).n > 0) vocabStarted++;
  }
  let expressionsStarted = 0;
  for (const e of levelExpressions) {
    if (startedStmt.get("expression", e.id).n > 0) expressionsStarted++;
  }

  const totals = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM characters) as totalCharacters,
        (SELECT COUNT(*) FROM vocabulary) as totalVocabulary,
        (SELECT COUNT(*) FROM expressions) as totalExpressions,
        (SELECT COUNT(*) FROM progress WHERE subject_type='character' AND srs_stage=9) as burnedCharacters,
        (SELECT COUNT(*) FROM progress WHERE subject_type='vocabulary' AND srs_stage=9) as burnedVocabulary,
        (SELECT COUNT(*) FROM progress WHERE subject_type='expression' AND srs_stage=9) as burnedExpressions,
        (SELECT MAX(level) FROM characters) as maxLevel
      `
    )
    .get();

  res.json({
    currentLevel,
    maxLevel: totals.maxLevel,
    lessonsAvailable,
    reviewsAvailable,
    nextReviewAt,
    levelProgress: {
      level: currentLevel,
      charactersTotal: levelChars.length,
      charactersStarted: charsStarted,
      charactersGuru: charsGuru,
      vocabularyTotal: levelVocab.length,
      vocabularyStarted: vocabStarted,
      expressionsTotal: levelExpressions.length,
      expressionsStarted,
    },
    totals,
  });
});

module.exports = router;
