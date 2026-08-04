const db = require("./db");

const GURU_STAGE = 5;
const PASS_RATIO = 0.9;

// The current level is the lowest level whose characters have not yet
// reached the 90%-guru threshold. All levels up to and including this one
// are "unlocked" (their lessons are available to study).
function computeCurrentLevel() {
  const maxLevelRow = db
    .prepare("SELECT MAX(level) as maxLevel FROM characters")
    .get();
  const maxLevel = maxLevelRow.maxLevel || 1;

  const charsByLevel = db.prepare(
    "SELECT id FROM characters WHERE level = ?"
  );
  const guruCountStmt = db.prepare(`
    SELECT COUNT(*) as n FROM progress
    WHERE subject_type = 'character' AND subject_id = ? AND srs_stage >= ?
  `);

  for (let level = 1; level <= maxLevel; level++) {
    const chars = charsByLevel.all(level);
    if (chars.length === 0) continue;
    let guruCount = 0;
    for (const c of chars) {
      const row = guruCountStmt.get(c.id, GURU_STAGE);
      if (row.n > 0) guruCount++;
    }
    if (guruCount / chars.length < PASS_RATIO) {
      return level;
    }
  }
  return maxLevel;
}

module.exports = { computeCurrentLevel, GURU_STAGE, PASS_RATIO };
