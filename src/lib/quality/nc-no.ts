import type Database from "better-sqlite3";

export function generateWebNcNo(db: Database.Database, year?: number): string {
  const yy = String((year ?? new Date().getFullYear()) % 100).padStart(2, "0");
  const prefix = `WNC${yy}`;
  const row = db
    .prepare(
      `SELECT nc_no FROM non_conformance
         WHERE nc_no LIKE ?
         ORDER BY nc_no DESC LIMIT 1`,
    )
    .get(`${prefix}%`) as { nc_no: string } | undefined;
  let next = 1;
  if (row) {
    const tail = row.nc_no.slice(prefix.length);
    const n = Number.parseInt(tail, 10);
    if (Number.isFinite(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(5, "0")}`;
}
