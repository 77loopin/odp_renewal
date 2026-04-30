import * as XLSX from "xlsx";
import { normalizeDate } from "./date";
import type { UpsertExcelRow } from "./repository";

const TARGET_SHEET = "부적합품 관리 대장";

const FIELD_ALIASES: Record<keyof UpsertExcelRow, string[]> = {
  nc_no: ["부적합품번호", "부적합품 번호", "NC번호", "NC No"],
  source: [],
  written_date: ["작성일자", "일자", "날짜"],
  model_name: ["모델명", "모델", "Model"],
  lot_no: ["LOT번호", "LOT 번호", "LOT", "Lot"],
  defect: ["부적합내용", "부적합 내용", "내용", "증상"],
  cause: ["부적합원인", "부적합 원인", "원인"],
  action: ["조치사항", "조치 사항", "조치"],
  result: ["처리결과", "결과"],
  handler: ["처리자", "담당자"],
};

const norm = (s: unknown) => String(s ?? "").replace(/\s+/g, "").toLowerCase();

function pickHeaderRow(rows: unknown[][]): number {
  // 진짜 헤더 행은 여러 alias 컬럼이 동시에 등장한다.
  // 제목 행(병합 셀에 "부 적 합 품 관 리 대 장"만 있는 등)을 잘못 잡지 않기 위해
  // 최소 3개 이상의 매핑 가능한 셀이 있는 행을 헤더로 본다.
  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i] || [];
    const map = buildColumnMap(row);
    const score = Object.keys(map).length;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestScore >= 3 ? bestIdx : -1;
}

function buildColumnMap(headerRow: unknown[]): Partial<Record<keyof UpsertExcelRow, number>> {
  const map: Partial<Record<keyof UpsertExcelRow, number>> = {};
  headerRow.forEach((cell, idx) => {
    const n = norm(cell);
    if (!n) return;
    for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof UpsertExcelRow, string[]][]) {
      if (field === "source") continue;
      if (aliases.some((a) => norm(a) === n) || aliases.some((a) => n.includes(norm(a)))) {
        if (map[field] === undefined) map[field] = idx;
      }
    }
  });
  return map;
}

export interface ParseExcelResult {
  rows: UpsertExcelRow[];
  errors: { row: number; reason: string }[];
}

export function parseExcel(buf: Buffer | ArrayBuffer): ParseExcelResult {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames.includes(TARGET_SHEET) ? TARGET_SHEET : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, raw: true });

  const headerIdx = pickHeaderRow(aoa);
  if (headerIdx < 0) {
    return { rows: [], errors: [{ row: 0, reason: "헤더 행을 찾을 수 없습니다." }] };
  }
  const colMap = buildColumnMap(aoa[headerIdx]);
  const required: (keyof UpsertExcelRow)[] = ["nc_no", "written_date", "model_name", "defect"];
  for (const f of required) {
    if (colMap[f] === undefined) {
      return { rows: [], errors: [{ row: headerIdx + 1, reason: `필수 컬럼(${f}) 매핑 실패` }] };
    }
  }

  const rows: UpsertExcelRow[] = [];
  const errors: { row: number; reason: string }[] = [];
  const cell = (r: unknown[], k: keyof UpsertExcelRow): unknown => {
    const idx = colMap[k];
    if (idx === undefined) return null;
    const v = r[idx];
    return v === "" ? null : v;
  };

  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const r = aoa[i] || [];
    const rowNumber = i + 1;

    const nc_no = String(cell(r, "nc_no") ?? "").trim();
    const dateRaw = cell(r, "written_date");
    const model_name = String(cell(r, "model_name") ?? "").trim();
    const defect = String(cell(r, "defect") ?? "").trim();

    if (!nc_no && !model_name && !defect && !dateRaw) continue;

    if (!nc_no) { errors.push({ row: rowNumber, reason: "부적합품 번호 누락" }); continue; }
    const written_date = normalizeDate(dateRaw);
    if (!written_date) { errors.push({ row: rowNumber, reason: `작성일자 파싱 실패 (${dateRaw ?? ""})` }); continue; }
    if (!model_name) { errors.push({ row: rowNumber, reason: "모델명 누락" }); continue; }
    if (!defect)     { errors.push({ row: rowNumber, reason: "부적합 내용 누락" }); continue; }

    rows.push({
      nc_no,
      source: "excel",
      written_date,
      model_name,
      lot_no: textOrNull(cell(r, "lot_no")),
      defect,
      cause: textOrNull(cell(r, "cause")),
      action: textOrNull(cell(r, "action")),
      result: textOrNull(cell(r, "result")),
      handler: textOrNull(cell(r, "handler")),
    });
  }
  return { rows, errors };
}

function textOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}
