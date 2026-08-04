const express = require("express");
const db = require("../db");
const { computeCurrentLevel } = require("../levels");
const { parseCharacter, parseVocabulary, parseExpression, getOrCreateProgress } = require("../subjects");
const { nextAvailableAt } = require("../srs");

const router = express.Router();

const VALID_TYPES = new Set(["character", "vocabulary", "expression"]);

router.get("/", (req, res) => {
  const currentLevel = computeCurrentLevel();

  const chars = db
    .prepare(
      `SELECT c.* FROM characters c
       LEFT JOIN progress p ON p.subject_type = 'character' AND p.subject_id = c.id
       WHERE c.level <= ? AND (p.id IS NULL OR p.srs_stage = 0)
       ORDER BY c.level, c.id`
    )
    .all(currentLevel)
    .map(parseCharacter);

  const vocab = db
    .prepare(
      `SELECT v.* FROM vocabulary v
       LEFT JOIN progress p ON p.subject_type = 'vocabulary' AND p.subject_id = v.id
       WHERE v.level <= ? AND (p.id IS NULL OR p.srs_stage = 0)
       ORDER BY v.level, v.id`
    )
    .all(currentLevel)
    .map(parseVocabulary);

  const expressions = db
    .prepare(
      `SELECT e.* FROM expressions e
       LEFT JOIN progress p ON p.subject_type = 'expression' AND p.subject_id = e.id
       WHERE e.level <= ? AND (p.id IS NULL OR p.srs_stage = 0)
       ORDER BY e.level, e.id`
    )
    .all(currentLevel)
    .map(parseExpression);

  // Characters, then vocabulary, then expressions, so you always meet the
  // building blocks before the things built from them.
  res.json({ currentLevel, items: [...chars, ...vocab, ...expressions] });
});

router.post("/complete", (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items must be a non-empty array." });
  }

  const now = new Date();
  const availableAt = nextAvailableAt(1, now).toISOString();

  const upsert = db.transaction((items) => {
    for (const { type, id } of items) {
      if (!VALID_TYPES.has(type)) continue;
      getOrCreateProgress(type, id);
      db.prepare(
        `UPDATE progress
         SET srs_stage = 1, started_at = datetime('now'), available_at = ?
         WHERE subject_type = ? AND subject_id = ?`
      ).run(availableAt, type, id);
    }
  });
  upsert(items);

  res.json({ ok: true });
});

module.exports = router;
