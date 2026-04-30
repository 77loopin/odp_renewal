import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = process.env.QUALITY_DB_PATH || path.join(dataDir, "quality.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  _db = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS non_conformance (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nc_no         TEXT    NOT NULL UNIQUE,
      source        TEXT    NOT NULL CHECK(source IN ('excel','web')),
      written_date  TEXT    NOT NULL,
      model_name    TEXT    NOT NULL,
      lot_no        TEXT,
      defect        TEXT    NOT NULL,
      cause         TEXT,
      action        TEXT,
      result        TEXT,
      handler       TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_nc_model        ON non_conformance(model_name);
    CREATE INDEX IF NOT EXISTS idx_nc_date         ON non_conformance(written_date);
    CREATE INDEX IF NOT EXISTS idx_nc_model_defect ON non_conformance(model_name, defect);
    CREATE INDEX IF NOT EXISTS idx_nc_lot          ON non_conformance(lot_no);
  `);
}
