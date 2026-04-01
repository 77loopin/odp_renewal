import catalogJson from "@/data/odp_products.json";
import type { CatalogData, Category, Series, Product, FlatProduct } from "@/types/product";

const data = catalogJson as unknown as CatalogData;

export function getCompanyInfo() {
  return {
    company: data.company,
    website: data.website,
    phone: data.phone,
  };
}

export function getAllCategories(): Category[] {
  return data.categories;
}

export function getCategoryById(id: string): Category | undefined {
  return data.categories.find((c) => c.id === id.toUpperCase());
}

export function getSeriesByCate(seriesCate: string): { series: Series; category: Category } | undefined {
  for (const cat of data.categories) {
    const s = cat.series.find((s) => s.series_cate === seriesCate);
    if (s) return { series: s, category: cat };
  }
  return undefined;
}

export function getProductByModel(model: string): FlatProduct | undefined {
  for (const cat of data.categories) {
    for (const s of cat.series) {
      const p = s.products.find(
        (p) => p.model === model || ("model_dual" in p && p.model_dual === model)
      );
      if (p) return { product: p, series: s, category: cat };
    }
  }
  return undefined;
}

export function getAllProductsFlat(): FlatProduct[] {
  const result: FlatProduct[] = [];
  for (const cat of data.categories) {
    for (const s of cat.series) {
      for (const p of s.products) {
        result.push({ product: p, series: s, category: cat });
      }
    }
  }
  return result;
}

export function getCategoryProductCount(cat: Category): number {
  return cat.series.reduce((sum, s) => sum + s.products.length, 0);
}

export function getCategoryPartCount(cat: Category): number {
  let count = 0;
  for (const s of cat.series) {
    for (const p of s.products) {
      count += p.part_numbers?.length || 0;
    }
  }
  return count;
}

export function getTotalPartCount(): number {
  let count = 0;
  for (const cat of data.categories) {
    count += getCategoryPartCount(cat);
  }
  return count;
}

export function getSeriesPartCount(series: Series): number {
  let count = 0;
  for (const p of series.products) {
    count += p.part_numbers?.length || 0;
  }
  return count;
}

export function getSeriesPowerRange(series: Series): string {
  const watts: number[] = [];
  for (const p of series.products) {
    if ("power_watts" in p && typeof p.power_watts === "number") {
      watts.push(p.power_watts);
    }
  }
  if (watts.length === 0) return "-";
  const min = Math.min(...watts);
  const max = Math.max(...watts);
  return min === max ? `${min}W` : `${min}~${max}W`;
}

export function getAllSeriesCates(): string[] {
  const cates: string[] = [];
  for (const cat of data.categories) {
    for (const s of cat.series) {
      cates.push(s.series_cate);
    }
  }
  return cates;
}

export function getAllModels(): string[] {
  const models: string[] = [];
  for (const cat of data.categories) {
    for (const s of cat.series) {
      for (const p of s.products) {
        models.push(p.model);
      }
    }
  }
  return models;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  DCDC: { bg: "bg-blue-50", text: "text-accent-blue", accent: "border-accent-blue" },
  POL: { bg: "bg-teal-50", text: "text-accent-teal", accent: "border-accent-teal" },
  ACDC: { bg: "bg-amber-50", text: "text-accent-amber", accent: "border-accent-amber" },
};
