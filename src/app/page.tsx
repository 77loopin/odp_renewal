import Link from "next/link";
import Container from "@/components/ui/Container";
import CategoryCard from "@/components/product/CategoryCard";
import { getAllCategories, getAllProductsFlat, getTotalPartCount } from "@/lib/catalog";

export default function HomePage() {
  const categories = getAllCategories();
  const totalProducts = getAllProductsFlat().length;
  const totalSeries = categories.reduce((sum, c) => sum + c.series.length, 0);
  const totalParts = getTotalPartCount();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-accent-blue/20" />
        <Container className="relative py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              전력 변환의 기준,<br />
              <span className="text-accent-blue">ODP Corp</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              DC-DC 컨버터, POL, AC-DC SMPS까지<br />
              다양한 전력 변환 솔루션을 제공합니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-accent-blue text-white font-medium hover:bg-blue-700 transition-colors"
              >
                제품 보기
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center px-6 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                제품 검색
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 flex flex-wrap gap-8">
            {[
              { value: totalParts, label: "개 파트넘버" },
              { value: totalProducts, label: "개 제품" },
              { value: totalSeries, label: "개 시리즈" },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="text-3xl font-bold text-accent-blue">{stat.value}</span>
                <span className="text-slate-400 ml-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="py-16">
        <Container>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">제품 카테고리</h2>
          <p className="text-slate-500 mb-8">용도에 맞는 전력 변환 솔루션을 찾아보세요.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
