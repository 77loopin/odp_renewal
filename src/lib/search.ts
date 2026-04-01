import Fuse from "fuse.js";
import { getAllProductsFlat } from "./catalog";
import type { FlatProduct } from "@/types/product";
import { formatPower, getInputVoltage } from "@/types/product";

export interface SearchItem {
  model: string;
  modelDual: string;
  partNumbers: string;
  seriesName: string;
  categoryId: string;
  categoryName: string;
  power: string;
  voltages: string;
  certifications: string;
  flat: FlatProduct;
}

function buildSearchIndex(): SearchItem[] {
  return getAllProductsFlat().map((fp) => ({
    model: fp.product.model,
    modelDual: ("model_dual" in fp.product && fp.product.model_dual) || "",
    partNumbers: fp.product.part_numbers?.join(", ") || "",
    seriesName: fp.series.series_name,
    categoryId: fp.category.id,
    categoryName: fp.category.name,
    power: formatPower(fp.product),
    voltages: getInputVoltage(fp.product).join(", "),
    certifications: fp.product.certifications.join(", "),
    flat: fp,
  }));
}

let fuseInstance: Fuse<SearchItem> | null = null;

export function getSearchEngine(): Fuse<SearchItem> {
  if (!fuseInstance) {
    const items = buildSearchIndex();
    fuseInstance = new Fuse(items, {
      keys: [
        { name: "model", weight: 3 },
        { name: "modelDual", weight: 2 },
        { name: "partNumbers", weight: 2 },
        { name: "seriesName", weight: 1.5 },
        { name: "categoryName", weight: 1 },
        { name: "power", weight: 1 },
        { name: "voltages", weight: 0.8 },
        { name: "certifications", weight: 0.5 },
      ],
      threshold: 0.35,
      includeScore: true,
    });
  }
  return fuseInstance;
}
