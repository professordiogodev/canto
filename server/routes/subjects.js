const express = require("express");
const db = require("../db");
const { allCharacters, allVocabulary, allExpressions, getProgress } = require("../subjects");
const { computeCurrentLevel } = require("../levels");
const { STAGE_NAMES } = require("../srs");

const router = express.Router();

function withProgress(subject) {
  const p = getProgress(subject.type, subject.id);
  return {
    ...subject,
    srsStage: p ? p.srs_stage : 0,
    srsStageName: STAGE_NAMES[p ? p.srs_stage : 0],
  };
}

router.get("/", (req, res) => {
  const currentLevel = computeCurrentLevel();
  const characters = allCharacters().map(withProgress);
  const vocabulary = allVocabulary().map(withProgress);
  const expressions = allExpressions().map(withProgress);

  const maxLevel = db
    .prepare("SELECT MAX(level) as m FROM characters")
    .get().m;

  const levels = [];
  for (let level = 1; level <= maxLevel; level++) {
    levels.push({
      level,
      unlocked: level <= currentLevel,
      characters: characters.filter((c) => c.level === level),
      vocabulary: vocabulary.filter((v) => v.level === level),
      expressions: expressions.filter((e) => e.level === level),
    });
  }

  res.json({ currentLevel, levels });
});

module.exports = router;
