import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import {
  listNC,
  getNC,
  createWebNC,
  updateNC,
  deleteNC,
  upsertExcelRows,
  getOptions,
} from "@/lib/quality/repository";

function makeDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE non_conformance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nc_no TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL CHECK(source IN ('excel','web')),
      written_date TEXT NOT NULL,
      model_name TEXT NOT NULL,
      lot_no TEXT,
      defect TEXT NOT NULL,
      cause TEXT,
      action TEXT,
      result TEXT,
      handler TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

describe("repository", () => {
  let db: ReturnType<typeof makeDb>;
  beforeEach(() => { db = makeDb(); });

  it("createWebNC + getNC", () => {
    const created = createWebNC(
      { written_date: "2026-04-30", model_name: "SDS6-24-12", defect: "출력없음" },
      db,
    );
    expect(created.nc_no).toMatch(/^WNC26\d{5}$/);
    expect(getNC(created.nc_no, db)?.model_name).toBe("SDS6-24-12");
  });

  it("listNC filters by model + defect + date range", () => {
    upsertExcelRows(
      [
        { nc_no: "NC2600001", source: "excel", written_date: "2026-01-02", model_name: "A", defect: "D1", cause: "C1" },
        { nc_no: "NC2600002", source: "excel", written_date: "2026-02-02", model_name: "A", defect: "D2", cause: "C2" },
        { nc_no: "NC2600003", source: "excel", written_date: "2026-03-02", model_name: "B", defect: "D1", cause: "C1" },
      ],
      db,
    );
    const r = listNC({ model: "A", defect: "D1" }, db);
    expect(r.total).toBe(1);
    expect(r.rows[0].nc_no).toBe("NC2600001");
    const r2 = listNC({ from: "2026-02-01", to: "2026-12-31" }, db);
    expect(r2.total).toBe(2);
  });

  it("upsertExcelRows: 새로 삽입한 뒤 같은 nc_no로 다시 호출하면 갱신", () => {
    upsertExcelRows(
      [{ nc_no: "NC2600001", source: "excel", written_date: "2026-01-01", model_name: "A", defect: "D" }],
      db,
    );
    const res = upsertExcelRows(
      [{ nc_no: "NC2600001", source: "excel", written_date: "2026-01-01", model_name: "A", defect: "Dchanged", cause: "X" }],
      db,
    );
    expect(res.inserted).toBe(0);
    expect(res.updated).toBe(1);
    expect(getNC("NC2600001", db)?.defect).toBe("Dchanged");
  });

  it("updateNC + deleteNC", () => {
    const c = createWebNC(
      { written_date: "2026-04-30", model_name: "M", defect: "D" }, db,
    );
    const updated = updateNC(c.nc_no, { written_date: "2026-04-30", model_name: "M", defect: "D2" }, db);
    expect(updated?.defect).toBe("D2");
    expect(deleteNC(c.nc_no, db)).toBe(true);
    expect(getNC(c.nc_no, db)).toBeNull();
  });

  it("getOptions returns sorted distinct values", () => {
    upsertExcelRows(
      [
        { nc_no: "NC2600001", source: "excel", written_date: "2026-01-01", model_name: "B", defect: "Z", cause: "c2" },
        { nc_no: "NC2600002", source: "excel", written_date: "2026-01-02", model_name: "A", defect: "Y", cause: "c1" },
      ],
      db,
    );
    const o = getOptions({}, db);
    expect(o.models).toEqual(["A", "B"]);
    expect(o.defects).toEqual(["Y", "Z"]);
    expect(o.causes).toEqual(["c1", "c2"]);
  });
});
