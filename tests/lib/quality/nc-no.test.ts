import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { generateWebNcNo } from "@/lib/quality/nc-no";

function makeDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE non_conformance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nc_no TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      written_date TEXT NOT NULL,
      model_name TEXT NOT NULL,
      defect TEXT NOT NULL
    );
  `);
  return db;
}

describe("generateWebNcNo", () => {
  it("첫 번호는 WNC{YY}00001", () => {
    const db = makeDb();
    expect(generateWebNcNo(db, 2026)).toBe("WNC2600001");
  });

  it("기존 WNC 번호의 다음 값으로 증가", () => {
    const db = makeDb();
    db.prepare(`INSERT INTO non_conformance (nc_no, source, written_date, model_name, defect)
                VALUES ('WNC2600003', 'web', '2026-01-01', 'M', 'D')`).run();
    expect(generateWebNcNo(db, 2026)).toBe("WNC2600004");
  });

  it("다른 연도 prefix는 영향 없음", () => {
    const db = makeDb();
    db.prepare(`INSERT INTO non_conformance (nc_no, source, written_date, model_name, defect)
                VALUES ('WNC2599999', 'web', '2025-01-01', 'M', 'D')`).run();
    expect(generateWebNcNo(db, 2026)).toBe("WNC2600001");
  });

  it("excel prefix(NC...)는 무시", () => {
    const db = makeDb();
    db.prepare(`INSERT INTO non_conformance (nc_no, source, written_date, model_name, defect)
                VALUES ('NC2699999', 'excel', '2026-01-01', 'M', 'D')`).run();
    expect(generateWebNcNo(db, 2026)).toBe("WNC2600001");
  });
});
