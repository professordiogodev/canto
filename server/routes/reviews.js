const express = require("express");
const db = require("../db");
const { getSubject, getProgress } = require("../subjects");
const { nextStage, nextAvailableAt, STAGE_NAMES } = require("../srs");

const router = express.Router();
const VALID_TYPES = new Set(["character", "vocabulary", "expression"]);

router.get("/", (req, res) => {
  const dueProgress = db
    .prepare(
      `SELECT * FROM progress
       WHERE srs_stage BETWEEN 1 AND 8 AND available_at IS NOT NULL AND available_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
    .all();

  const items = dueProgress
    .map((p) => {
      const subject = getSubject(p.subject_type, p.subject_id);
      if (!subject) return null;
      return { ...subject, srsStage: p.srs_stage };
    })
    .filter(Boolean);

  // Shuffle so characters/vocab and levels are interleaved.
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  res.json({ items });
});

router.post("/submit", (req, res) => {
  const { type, id, meaningCorrect, readingCorrect } = req.body || {};
  if (
    !VALID_TYPES.has(type) ||
    typeof id !== "number" ||
    typeof meaningCorrect !== "boolean" ||
    typeof readingCorrect !== "boolean"
  ) {
    return res.status(400).json({ error: "Invalid submission." });
  }

  const progress = getProgress(type, id);
  if (!progress || progress.srs_stage < 1) {
    return res.status(400).json({ error: "This item is not currently in review." });
  }

  const stageBefore = progress.srs_stage;
  const stageAfter = nextStage(stageBefore, meaningCorrect, readingCorrect);
  const now = new Date();
  const availableAt = nextAvailableAt(stageAfter, now);

  db.prepare(
    `UPDATE progress SET
       srs_stage = ?,
       available_at = ?,
       meaning_correct = meaning_correct + ?,
       meaning_incorrect = meaning_incorrect + ?,
       reading_correct = reading_correct + ?,
       reading_incorrect = reading_incorrect + ?,
       passed_at = CASE WHEN passed_at IS NULL AND ? >= 5 THEN datetime('now') ELSE passed_at END,
       burned_at = CASE WHEN ? = 9 THEN datetime('now') ELSE burned_at END
     WHERE subject_type = ? AND subject_id = ?`
  ).run(
    stageAfter,
    availableAt ? availableAt.toISOString() : null,
    meaningCorrect ? 1 : 0,
    meaningCorrect ? 0 : 1,
    readingCorrect ? 1 : 0,
    readingCorrect ? 0 : 1,
    stageAfter,
    stageAfter,
    type,
    id
  );

  db.prepare(
    `INSERT INTO review_history (subject_type, subject_id, meaning_correct, reading_correct, stage_before, stage_after)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(type, id, meaningCorrect ? 1 : 0, readingCorrect ? 1 : 0, stageBefore, stageAfter);

  res.json({
    ok: true,
    stageBefore,
    stageAfter,
    stageName: STAGE_NAMES[stageAfter],
  });
});

module.exports = router;
