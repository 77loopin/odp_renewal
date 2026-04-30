import type Database from "better-sqlite3";
import { getDb } from "./db";

export interface CatalogProductRow {
  part_number: string;
  series_model: string;
  series_cate: string;
  series_name: string;
  category_id: string;
  input_voltage: string | null;
  output_voltage: string | null;
  power_watts: number | null;
}

export function getAllCatalogPartNumbers(db: Database.Database = getDb()): string[] {
  return (db.prepare(`SELECT part_number FROM catalog_product ORDER BY part_number`).all() as { part_number: string }[])
    .map((r) => r.part_number);
}

export function lookupCatalog(part_number: string, db: Database.Database = getDb()): CatalogProductRow | null {
  const row = db.prepare(`SELECT * FROM catalog_product WHERE part_number = ?`).get(part_number) as CatalogProductRow | undefined;
  return row ?? null;
}

export function lookupCatalogMany(part_numbers: string[], db: Database.Database = getDb()): Record<string, CatalogProductRow> {
  if (!part_numbers.length) return {};
  const placeholders = part_numbers.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT * FROM catalog_product WHERE part_number IN (${placeholders})`)
    .all(...part_numbers) as CatalogProductRow[];
  const m: Record<string, CatalogProductRow> = {};
  for (const r of rows) m[r.part_number] = r;
  return m;
}
