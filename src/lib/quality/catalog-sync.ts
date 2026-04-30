import type Database from "better-sqlite3";
import { getAllProductsFlat } from "@/lib/catalog";
import { isACDC } from "@/types/product";

export interface CatalogRow {
  part_number: string;
  series_model: string;
  series_cate: string;
  series_name: string;
  category_id: string;
  input_voltage: string | null;
  output_voltage: string | null;
  power_watts: number | null;
}

/**
 * 카탈로그(JSON)을 DB에 동기화한다.
 * 매 호출마다 catalog_product 테이블을 비우고 다시 채운다 (idempotent).
 * 시리즈 모델(예: 'SDS6')과 그 하위 모든 part_number(예: 'SDS6-24-12')를 각각 한 행으로 저장.
 */
export function syncCatalog(db: Database.Database): { count: number } {
  const rows = collectRows();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM catalog_product`).run();
    const stmt = db.prepare(
      `INSERT INTO catalog_product
         (part_number, series_model, series_cate, series_name, category_id, input_voltage, output_voltage, power_watts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const r of rows) {
      stmt.run(
        r.part_number, r.series_model, r.series_cate, r.series_name,
        r.category_id, r.input_voltage, r.output_voltage, r.power_watts,
      );
    }
  });
  tx();
  return { count: rows.length };
}

function collectRows(): CatalogRow[] {
  const seen = new Map<string, CatalogRow>();
  for (const flat of getAllProductsFlat()) {
    const { product, series, category } = flat;
    const watts = "power_watts" in product && typeof product.power_watts === "number"
      ? product.power_watts
      : null;
    const baseInput = isACDC(product)
      ? product.input_voltage
      : (product.input_voltage_ranges?.[0] ?? null);

    // 1) 시리즈 레벨 (model 자체) — quality 데이터가 'SDS6' 같은 짧은 모델명만 가질 때 매칭용
    addRow(seen, {
      part_number: product.model,
      series_model: product.model,
      series_cate: series.series_cate,
      series_name: series.series_name,
      category_id: category.id,
      input_voltage: baseInput,
      output_voltage: null,
      power_watts: watts,
    });
    // 1-1) 듀얼 출력 모델명도 별칭으로
    if ("model_dual" in product && product.model_dual) {
      addRow(seen, {
        part_number: product.model_dual,
        series_model: product.model,
        series_cate: series.series_cate,
        series_name: series.series_name,
        category_id: category.id,
        input_voltage: baseInput,
        output_voltage: null,
        power_watts: watts,
      });
    }

    // 2) 각 part_number — quality 데이터의 model_name 형식(SDS6-24-12)과 매칭
    const detailMap = new Map<string, { input_voltage: string; output_voltage: string }>();
    for (const d of product.parts_detail ?? []) {
      detailMap.set(d.part_number, { input_voltage: d.input_voltage, output_voltage: d.output_voltage });
    }
    for (const pn of product.part_numbers ?? []) {
      const detail = detailMap.get(pn);
      addRow(seen, {
        part_number: pn,
        series_model: product.model,
        series_cate: series.series_cate,
        series_name: series.series_name,
        category_id: category.id,
        input_voltage: detail?.input_voltage ?? baseInput,
        output_voltage: detail?.output_voltage ?? null,
        power_watts: watts,
      });
    }
    // 3) parts_detail에만 있고 part_numbers에 없는 항목
    for (const d of product.parts_detail ?? []) {
      addRow(seen, {
        part_number: d.part_number,
        series_model: product.model,
        series_cate: series.series_cate,
        series_name: series.series_name,
        category_id: category.id,
        input_voltage: d.input_voltage,
        output_voltage: d.output_voltage,
        power_watts: watts,
      });
    }
  }
  return Array.from(seen.values());
}

function addRow(map: Map<string, CatalogRow>, row: CatalogRow) {
  if (!row.part_number) return;
  if (!map.has(row.part_number)) map.set(row.part_number, row);
}
