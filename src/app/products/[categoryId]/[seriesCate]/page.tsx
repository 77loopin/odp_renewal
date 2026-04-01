import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductTable from "@/components/product/ProductTable";
import { CertBadges } from "@/components/ui/Badge";
import { getSeriesByCate, getAllCategories, getSeriesPowerRange, CATEGORY_COLORS } from "@/lib/catalog";

interface Props {
  params: { categoryId: string; seriesCate: string };
}

export function generateStaticParams() {
  const params: { categoryId: string; seriesCate: string }[] = [];
  for (const cat of getAllCategories()) {
    for (const s of cat.series) {
      params.push({ categoryId: cat.id, seriesCate: s.series_cate });
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const result = getSeriesByCate(params.seriesCate);
  if (!result) return {};
  return { title: result.series.series_name };
}

export default function SeriesPage({ params }: Props) {
  const result = getSeriesByCate(params.seriesCate);
  if (!result) notFound();

  const { series, category } = result;
  const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.DCDC;
  const powerRange = getSeriesPowerRange(series);

  return (
    <Container className="py-4">
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "전체 제품", href: "/products" },
          { label: category.name, href: `/products/${category.id}` },
          { label: series.series_name },
        ]}
      />

      {/* Series Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">{series.series_name}</h1>
          <span className={`px-3 py-1 text-sm font-medium rounded-lg ${colors.bg} ${colors.text}`}>
            {series.package_type}
          </span>
          {powerRange !== "-" && (
            <span className="px-3 py-1 text-sm font-mono font-medium rounded-lg bg-slate-100 text-slate-700">
              {powerRange}
            </span>
          )}
        </div>
        <p className="text-slate-600 mb-4 max-w-3xl">{series.description}</p>

        <div className="flex items-center gap-4 mb-4">
          <CertBadges certs={series.certifications} />
          <span className="text-sm text-slate-400">{series.products.length}개 모델</span>
        </div>

        {series.features && series.features.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-5 mt-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">주요 특징</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {series.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-current ${colors.text} flex-shrink-0`} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {series.note && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            {series.note}
          </div>
        )}
      </div>

      {/* Products Table */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">제품 목록</h2>
        <ProductTable products={series.products} categoryId={category.id} />
      </div>
    </Container>
  );
}
