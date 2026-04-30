import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { syncCatalog } from "./catalog-sync";

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
  // 카탈로그(JSON)는 빌드 시점에 갱신되므로 매 부팅마다 sync (idempotent).
  // 환경변수로 비활성화도 가능 (테스트 등).
  if (process.env.QUALITY_SKIP_CATALOG_SYNC !== "1") {
    try { syncCatalog(db); } catch { /* 카탈로그 sync 실패해도 부적합 기능은 동작 */ }
  }
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

    CREATE TABLE IF NOT EXISTS catalog_product (
      part_number    TEXT PRIMARY KEY,
      series_model   TEXT NOT NULL,
      series_cate    TEXT NOT NULL,
      series_name    TEXT NOT NULL,
      category_id    TEXT NOT NULL,
      input_voltage  TEXT,
      output_voltage TEXT,
      power_watts    REAL
    );
    CREATE INDEX IF NOT EXISTS idx_cat_series_model ON catalog_product(series_model);
    CREATE INDEX IF NOT EXISTS idx_cat_category     ON catalog_product(category_id);
  `);
}
