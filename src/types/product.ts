export interface OutputOption {
  voltage: string;
  current: string;
}

export interface PartDetail {
  part_number: string;
  input_voltage: string;
  output_voltage: string;
}

export interface BaseProduct {
  model: string;
  model_dual?: string;
  image_url: string;
  detail_url: string;
  output_options: OutputOption[];
  certifications: string[];
  part_numbers?: string[];
  parts_detail?: PartDetail[];
}

export interface DCDCProduct extends BaseProduct {
  power_watts: number;
  input_voltage_ranges: string[];
}

export interface POLProduct extends BaseProduct {
  power_watts_range: string;
  input_voltage_ranges: string[];
}

export interface ACDCProduct extends BaseProduct {
  power_watts: number;
  input_voltage: string;
}

export type Product = DCDCProduct | POLProduct | ACDCProduct;

export interface Series {
  series_name: string;
  series_cate: string;
  description: string;
  package_type: string;
  features?: string[];
  note?: string;
  certifications: string[];
  products: Product[];
}

export interface Category {
  id: string;
  name: string;
  cate_prefix: string;
  series: Series[];
}

export interface CatalogData {
  company: string;
  website: string;
  phone: string;
  scraped_date: string;
  base_url: string;
  image_base_url: string;
  categories: Category[];
}

export interface FlatProduct {
  product: Product;
  series: Series;
  category: Category;
}

export function isDCDC(p: Product): p is DCDCProduct {
  return "input_voltage_ranges" in p && "power_watts" in p;
}

export function isPOL(p: Product): p is POLProduct {
  return "power_watts_range" in p;
}

export function isACDC(p: Product): p is ACDCProduct {
  return "input_voltage" in p && "power_watts" in p;
}

export function formatPower(p: Product): string {
  if (isPOL(p)) return `${p.power_watts_range}W`;
  return `${p.power_watts}W`;
}

export function getInputVoltage(p: Product): string[] {
  if (isACDC(p)) return [p.input_voltage];
  return p.input_voltage_ranges;
}
