"use client";
import Link from "next/link";

export interface CatalogMeta {
  part_number: string;
  series_model: string;
  series_cate: string;
  series_name: string;
  category_id: string;
  input_voltage: string | null;
  output_voltage: string | null;
  power_watts: number | null;
}

const CATEGORY_BADGE: Record<string, string> = {
  DCDC: "bg-blue-50 text-accent-blue",
  POL:  "bg-teal-50 text-accent-teal",
  ACDC: "bg-amber-50 text-accent-amber",
};

interface Props {
  model: string;
  meta?: CatalogMeta | null;
  showBadge?: boolean;
  className?: string;
}

export default function ModelLink({ model, meta, showBadge, className = "" }: Props) {
  if (!meta) return <span className={className}>{model}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Link
        href={`/products/detail/${meta.series_model}`}
        className="text-accent-blue hover:underline"
        title={`${meta.series_name} → ${meta.part_number}`}
      >
        {model}
      </Link>
      {showBadge && (
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${CATEGORY_BADGE[meta.category_id] ?? "bg-slate-100 text-slate-600"}`}>
          {meta.category_id}
        </span>
      )}
    </span>
  );
}
