"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getSearchEngine } from "@/lib/search";
import { formatPower, getInputVoltage } from "@/types/product";
import { CertBadges } from "@/components/ui/Badge";
import { CATEGORY_COLORS } from "@/lib/catalog";
import ProductImage from "@/components/product/ProductImage";

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const engine = getSearchEngine();
    return engine.search(query, { limit: 30 });
  }, [query]);

  if (!query.trim()) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-lg mb-4">검색어를 입력해 주세요</p>
        <div className="flex flex-wrap justify-center gap-2">
          {["SDS10", "24V", "ACDC", "NOF", "Medical", "50W"].map((ex) => (
            <Link
              key={ex}
              href={`/search?q=${ex}`}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-sm text-slate-600 hover:bg-accent-blue hover:text-white transition-colors"
            >
              {ex}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-lg mb-2">
          &ldquo;{query}&rdquo;에 대한 검색 결과가 없습니다.
        </p>
        <p className="text-slate-400 text-sm">다른 키워드로 검색해 보세요.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-6">
        &ldquo;{query}&rdquo; 검색 결과 <span className="font-medium text-slate-700">{results.length}건</span>
      </p>
      <div className="space-y-3">
        {results.map(({ item }) => {
          const { flat } = item;
          const { product, series, category } = flat;
          const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.DCDC;

          return (
            <Link key={product.model} href={`/products/detail/${product.model}`}>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all">
                <ProductImage
                  src={product.image_url}
                  alt={product.model}
                  width={64}
                  height={64}
                  className="object-contain rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}>
                      {category.id}
                    </span>
                    <span className="text-xs text-slate-400">{series.series_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-slate-900">{product.model}</span>
                    <span className="font-mono text-sm text-accent-blue font-medium">{formatPower(product)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {getInputVoltage(product).join(" | ")}
                  </div>
                  <CertBadges certs={product.certifications} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
