import type Database from "better-sqlite3";
import { getDb } from "./db";
import { generateWebNcNo } from "./nc-no";
import type {
  NonConformance,
  NCInput,
  NCFilters,
  NCListResult,
  Source,
} from "./types";

const COLUMNS =
  "id, nc_no, source, written_date, model_name, lot_no, defect, cause, action, result, handler, created_at, updated_at";

const SORT_MAP: Record<NonNullable<NCFilters["sort"]>, string> = {
  date_desc: "written_date DESC, nc_no DESC",
  date_asc: "written_date ASC, nc_no ASC",
  nc_desc: "nc_no DESC",
  nc_asc: "nc_no ASC",
  model_asc: "model_name ASC, written_date DESC",
};

function buildWhere(f: NCFilters): { sql: string; params: unknown[] } {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    where.push(
      `(model_name LIKE ? OR lot_no LIKE ? OR defect LIKE ? OR cause LIKE ? OR action LIKE ? OR result LIKE ? OR handler LIKE ? OR nc_no LIKE ?)`,
    );
    const like = `%${f.q}%`;
    for (let i = 0; i < 8; i++) params.push(like);
  }
  if (f.model) { where.push("model_name = ?"); params.push(f.model); }
  if (f.defect) { where.push("defect = ?"); params.push(f.defect); }
  if (f.cause) { where.push("cause = ?"); params.push(f.cause); }
  if (f.action) { where.push("action = ?"); params.push(f.action); }
  if (f.lot) { where.push("lot_no LIKE ?"); params.push(`%${f.lot}%`); }
  if (f.from) { where.push("written_date >= ?"); params.push(f.from); }
  if (f.to) { where.push("written_date <= ?"); params.push(f.to); }
  if (f.source) { where.push("source = ?"); params.push(f.source); }
  return {
    sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export function listNC(filters: NCFilters, db: Database.Database = getDb()): NCListResult {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(10, filters.pageSize ?? 50));
  const offset = (page - 1) * pageSize;
  const sort = SORT_MAP[filters.sort ?? "date_desc"];
  const { sql: whereSql, params } = buildWhere(filters);

  const rows = db
    .prepare(
      `SELECT ${COLUMNS} FROM non_conformance ${whereSql} ORDER BY ${sort} LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as NonConformance[];

  const totalRow = db
    .prepare(`SELECT COUNT(*) as c FROM non_conformance ${whereSql}`)
    .get(...params) as { c: number };

  return { rows, total: totalRow.c, page, pageSize };
}

export function getNC(nc_no: string, db: Database.Database = getDb()): NonConformance | null {
  const row = db
    .prepare(`SELECT ${COLUMNS} FROM non_conformance WHERE nc_no = ?`)
    .get(nc_no) as NonConformance | undefined;
  return row ?? null;
}

export function createWebNC(
  input: NCInput,
  db: Database.Database = getDb(),
): NonConformance {
  return db.transaction((): NonConformance => {
    const yy = Number(input.written_date.slice(0, 4));
    const nc_no = generateWebNcNo(db, isNaN(yy) ? new Date().getFullYear() : yy);
    db.prepare(
      `INSERT INTO non_conformance
         (nc_no, source, written_date, model_name, lot_no, defect, cause, action, result, handler)
       VALUES (?, 'web', ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      nc_no,
      input.written_date,
      input.model_name,
      input.lot_no ?? null,
      input.defect,
      input.cause ?? null,
      input.action ?? null,
      input.result ?? null,
      input.handler ?? null,
    );
    return getNC(nc_no, db) as NonConformance;
  })();
}

export function updateNC(
  nc_no: string,
  input: NCInput,
  db: Database.Database = getDb(),
): NonConformance | null {
  const existing = getNC(nc_no, db);
  if (!existing) return null;
  db.prepare(
    `UPDATE non_conformance SET
       written_date = ?, model_name = ?, lot_no = ?, defect = ?,
       cause = ?, action = ?, result = ?, handler = ?,
       updated_at = datetime('now')
     WHERE nc_no = ?`,
  ).run(
    input.written_date,
    input.model_name,
    input.lot_no ?? null,
    input.defect,
    input.cause ?? null,
    input.action ?? null,
    input.result ?? null,
    input.handler ?? null,
    nc_no,
  );
  return getNC(nc_no, db);
}

export function deleteNC(nc_no: string, db: Database.Database = getDb()): boolean {
  const info = db.prepare(`DELETE FROM non_conformance WHERE nc_no = ?`).run(nc_no);
  return info.changes > 0;
}

export interface UpsertExcelRow extends NCInput {
  nc_no: string;
  source: Source;
}

export function upsertExcelRows(
  rows: UpsertExcelRow[],
  db: Database.Database = getDb(),
): { inserted: number; updated: number } {
  const stmt = db.prepare(
    `INSERT INTO non_conformance
       (nc_no, source, written_date, model_name, lot_no, defect, cause, action, result, handler)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(nc_no) DO UPDATE SET
       written_date = excluded.written_date,
       model_name   = excluded.model_name,
       lot_no       = excluded.lot_no,
       defect       = excluded.defect,
       cause        = excluded.cause,
       action       = excluded.action,
       result       = excluded.result,
       handler      = excluded.handler,
       updated_at   = datetime('now')`,
  );
  const exists = db.prepare(`SELECT 1 FROM non_conformance WHERE nc_no = ?`);

  let inserted = 0;
  let updated = 0;
  const tx = db.transaction((batch: UpsertExcelRow[]) => {
    for (const r of batch) {
      const before = exists.get(r.nc_no);
      stmt.run(
        r.nc_no,
        r.source,
        r.written_date,
        r.model_name,
        r.lot_no ?? null,
        r.defect,
        r.cause ?? null,
        r.action ?? null,
        r.result ?? null,
        r.handler ?? null,
      );
      if (before) updated++;
      else inserted++;
    }
  });
  tx(rows);
  return { inserted, updated };
}

export interface OptionSet {
  models: string[];
  defects: string[];
  causes: string[];
  actions: string[];
  handlers: string[];
}

export function getOptions(
  scope: { model?: string; modelSort?: "alpha" | "frequency" } = {},
  db: Database.Database = getDb(),
): OptionSet {
  const params = scope.model ? [scope.model] : [];
  const all = (col: string): string[] => {
    const sql = scope.model
      ? `SELECT DISTINCT ${col} as v FROM non_conformance WHERE model_name = ? AND ${col} IS NOT NULL AND ${col} != '' ORDER BY v`
      : `SELECT DISTINCT ${col} as v FROM non_conformance WHERE ${col} IS NOT NULL AND ${col} != '' ORDER BY v`;
    return (db.prepare(sql).all(...params) as { v: string }[]).map((r) => r.v);
  };
  let models: string[];
  if (scope.model) {
    models = [scope.model];
  } else if (scope.modelSort === "frequency") {
    // 부적합 많은 순 → 부적합 0건인 catalog part_number는 알파벳 순으로 뒤에 붙임
    const ranked = (db.prepare(
      `SELECT model_name as v, COUNT(*) as c FROM non_conformance GROUP BY model_name ORDER BY c DESC, v ASC`,
    ).all() as { v: string; c: number }[]).map((r) => r.v);
    const seen = new Set(ranked);
    const catalogTail = (db.prepare(
      `SELECT part_number as v FROM catalog_product ORDER BY part_number ASC`,
    ).all() as { v: string }[]).map((r) => r.v).filter((v) => !seen.has(v));
    models = [...ranked, ...catalogTail];
  } else {
    // 부적합 이력 모델명 ∪ 카탈로그 part_number  (정렬·중복제거)
    const historic = (db.prepare(`SELECT DISTINCT model_name as v FROM non_conformance`).all() as { v: string }[]).map((r) => r.v);
    const catalog  = (db.prepare(`SELECT part_number as v FROM catalog_product`).all() as { v: string }[]).map((r) => r.v);
    models = Array.from(new Set([...historic, ...catalog])).sort();
  }
  return {
    models,
    defects: all("defect"),
    causes: all("cause"),
    actions: all("action"),
    handlers: all("handler"),
  };
}
