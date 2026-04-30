export type Source = "excel" | "web";

export interface NonConformance {
  id: number;
  nc_no: string;
  source: Source;
  written_date: string;
  model_name: string;
  lot_no: string | null;
  defect: string;
  cause: string | null;
  action: string | null;
  result: string | null;
  handler: string | null;
  created_at: string;
  updated_at: string;
}

export interface NCInput {
  written_date: string;
  model_name: string;
  lot_no?: string | null;
  defect: string;
  cause?: string | null;
  action?: string | null;
  result?: string | null;
  handler?: string | null;
}

export interface NCFilters {
  q?: string;
  model?: string;
  defect?: string;
  cause?: string;
  action?: string;
  lot?: string;
  from?: string;
  to?: string;
  source?: Source;
  page?: number;
  pageSize?: number;
  sort?: "date_desc" | "date_asc" | "nc_desc" | "nc_asc" | "model_asc";
}

export interface NCListResult {
  rows: NonConformance[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}
