// 사용법: pnpm seed:quality <엑셀파일경로>
// 예:    pnpm seed:quality "/Users/user/Downloads/부적합관리대장.xlsx"
import path from "node:path";
import fs from "node:fs";
import url from "node:url";

const arg = process.argv[2];
if (!arg) { console.error("엑셀 파일 경로를 인자로 주세요."); process.exit(1); }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
process.env.QUALITY_DB_PATH = process.env.QUALITY_DB_PATH || path.join(__dirname, "..", "data", "quality.db");

const { parseExcel } = await import("../src/lib/quality/excel.ts");
const { upsertExcelRows } = await import("../src/lib/quality/repository.ts");

const buf = fs.readFileSync(path.resolve(arg));
const { rows, errors } = parseExcel(buf);
const { inserted, updated } = rows.length ? upsertExcelRows(rows) : { inserted: 0, updated: 0 };
console.log(`완료: 신규 ${inserted}건 / 갱신 ${updated}건 / 에러 ${errors.length}건`);
if (errors.length) {
  console.log("에러 샘플 (최대 20):");
  console.log(errors.slice(0, 20));
}
