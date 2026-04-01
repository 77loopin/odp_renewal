import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import SeriesCard from "@/components/product/SeriesCard";
import { getAllCategories, CATEGORY_COLORS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "전체 제품",
};

export default function ProductsPage() {
  const categories = getAllCategories();

  return (
    <Container className="py-4">
      <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "전체 제품" }]} />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">전체 제품</h1>
      <p className="text-slate-500 mb-10">ODP Corp의 모든 전력 변환 제품을 확인하세요.</p>

      {categories.map((cat) => {
        const colors = CATEGORY_COLORS[cat.id] || CATEGORY_COLORS.DCDC;
        return (
          <section key={cat.id} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-1 h-8 rounded-full bg-current ${colors.text}`} />
              <h2 className="text-xl font-bold text-slate-900">{cat.name}</h2>
              <span className="text-sm text-slate-400">{cat.series.length}개 시리즈</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cat.series
                .filter((s) => s.products.length > 0)
                .map((s) => (
                  <SeriesCard key={s.series_cate} series={s} categoryId={cat.id} />
                ))}
            </div>
          </section>
        );
      })}
    </Container>
  );
}
