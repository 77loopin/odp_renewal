import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseExcel } from "@/lib/quality/excel";

const fixturePath = path.join(process.cwd(), "tests/fixtures/sample.xlsx");

describe("parseExcel", () => {
  it("정상 행을 파싱하고 다양한 날짜 포맷을 정규화", () => {
    const buf = fs.readFileSync(fixturePath);
    const r = parseExcel(buf);
    expect(r.rows.length).toBe(3);
    expect(r.errors.length).toBe(1);
    expect(r.errors[0].reason).toMatch(/날짜|작성일자/);
    expect(r.rows.every((x) => x.written_date === "2026-01-02")).toBe(true);
    expect(r.rows[0].nc_no).toBe("NC260001");
    expect(r.rows[0].source).toBe("excel");
  });

  it("LOT/원인 등 NULL 값 허용", () => {
    const buf = fs.readFileSync(fixturePath);
    const r = parseExcel(buf);
    const row = r.rows.find((x) => x.nc_no === "NC260004")!;
    expect(row.lot_no).toBeNull();
  });
});
