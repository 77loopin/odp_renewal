import Link from "next/link";
import Image from "next/image";
import type { Series } from "@/types/product";
import { getSeriesPowerRange, getSeriesPartCount, CATEGORY_COLORS } from "@/lib/catalog";
import { CertBadges } from "@/components/ui/Badge";

interface SeriesCardProps {
  series: Series;
  categoryId: string;
}

export default function SeriesCard({ series, categoryId }: SeriesCardProps) {
  const colors = CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.DCDC;
  const powerRange = getSeriesPowerRange(series);
  const partCount = getSeriesPartCount(series);
  const firstProduct = series.products[0];

  if (series.products.length === 0) return null;

  return (
    <Link href={`/products/${categoryId}/${series.series_cate}`}>
      <div className="group rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all duration-300 hover:border-slate-300 overflow-hidden">
        <div className="flex">
          {firstProduct?.image_url && (
            <div className="relative w-28 sm:w-36 flex-shrink-0 bg-slate-50 flex items-center justify-center p-3">
              <Image
                src={firstProduct.image_url}
                alt={series.series_name}
                width={120}
                height={120}
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-slate-900 group-hover:text-accent-blue transition-colors">
                {series.series_name}
              </h3>
              <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}>
                {series.package_type}
              </span>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
              {series.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-mono font-medium text-slate-700">{powerRange}</span>
              <span>&middot;</span>
              <span>{series.products.length}개 제품{partCount > 0 && ` (${partCount}개 파트넘버)`}</span>
              <span>&middot;</span>
              <CertBadges certs={series.certifications} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
