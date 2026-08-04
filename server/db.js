const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "canto.sqlite");
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// better-sqlite3-style helper: run a function inside a transaction.
db.transaction = function transaction(fn) {
  return (...args) => {
    db.exec("BEGIN");
    try {
      const result = fn(...args);
      db.exec("COMMIT");
      return result;
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  };
};

db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY,
    level INTEGER NOT NULL,
    hanzi TEXT NOT NULL,
    jyutping TEXT NOT NULL,      -- JSON array of strings
    meanings TEXT NOT NULL,      -- JSON array of strings, primary first
    meaning_mnemonic TEXT NOT NULL,
    reading_mnemonic TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY,
    level INTEGER NOT NULL,
    hanzi TEXT NOT NULL,
    jyutping TEXT NOT NULL,        -- JSON array of strings
    meanings TEXT NOT NULL,        -- JSON array of strings, primary first
    meaning_mnemonic TEXT NOT NULL,
    reading_mnemonic TEXT NOT NULL,
    character_ids TEXT NOT NULL DEFAULT '[]' -- JSON array of character ids used
  );

  CREATE TABLE IF NOT EXISTS expressions (
    id INTEGER PRIMARY KEY,
    level INTEGER NOT NULL,
    hanzi TEXT NOT NULL,
    jyutping TEXT NOT NULL,        -- JSON array of strings
    meanings TEXT NOT NULL,        -- JSON array of strings, primary first
    meaning_mnemonic TEXT NOT NULL,
    reading_mnemonic TEXT NOT NULL,
    character_ids TEXT NOT NULL DEFAULT '[]' -- JSON array of character ids used
  );

  CREATE TABLE IF NOT EXISTS review_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_type TEXT NOT NULL,
    subject_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    meaning_correct INTEGER NOT NULL,
    reading_correct INTEGER NOT NULL,
    stage_before INTEGER NOT NULL,
    stage_after INTEGER NOT NULL
  );
`);

// The 'progress' table's subject_type CHECK constraint originally only
// allowed 'character'/'vocabulary'. Migrate older databases in place (SQLite
// can't ALTER a CHECK constraint directly) so existing progress survives the
// addition of the 'expression' subject type.
const progressTableSql = db
  .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='progress'")
  .get();

if (progressTableSql && !progressTableSql.sql.includes("'expression'")) {
  db.exec("ALTER TABLE progress RENAME TO progress_old_migration");
  db.exec(`
    CREATE TABLE progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_type TEXT NOT NULL CHECK (subject_type IN ('character','vocabulary','expression')),
      subject_id INTEGER NOT NULL,
      srs_stage INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT,
      started_at TEXT,
      passed_at TEXT,
      burned_at TEXT,
      available_at TEXT,
      meaning_correct INTEGER NOT NULL DEFAULT 0,
      meaning_incorrect INTEGER NOT NULL DEFAULT 0,
      reading_correct INTEGER NOT NULL DEFAULT 0,
      reading_incorrect INTEGER NOT NULL DEFAULT 0,
      UNIQUE(subject_type, subject_id)
    )
  `);
  db.exec(`
    INSERT INTO progress SELECT * FROM progress_old_migration
  `);
  db.exec("DROP TABLE progress_old_migration");
} else if (!progressTableSql) {
  db.exec(`
    CREATE TABLE progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_type TEXT NOT NULL CHECK (subject_type IN ('character','vocabulary','expression')),
      subject_id INTEGER NOT NULL,
      srs_stage INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT,
      started_at TEXT,
      passed_at TEXT,
      burned_at TEXT,
      available_at TEXT,
      meaning_correct INTEGER NOT NULL DEFAULT 0,
      meaning_incorrect INTEGER NOT NULL DEFAULT 0,
      reading_correct INTEGER NOT NULL DEFAULT 0,
      reading_incorrect INTEGER NOT NULL DEFAULT 0,
      UNIQUE(subject_type, subject_id)
    )
  `);
}

module.exports = db;
