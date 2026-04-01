import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import SeriesCard from "@/components/product/SeriesCard";
import { getCategoryById, getAllCategories, getCategoryProductCount, CATEGORY_COLORS } from "@/lib/catalog";

interface Props {
  params: { categoryId: string };
}

export function generateStaticParams() {
  return getAllCategories().map((c) => ({ categoryId: c.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = getCategoryById(params.categoryId);
  if (!cat) return {};
  return { title: cat.name };
}

export default function CategoryPage({ params }: Props) {
  const category = getCategoryById(params.categoryId);
  if (!category) notFound();

  const productCount = getCategoryProductCount(category);
  const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.DCDC;
  const activeSeries = category.series.filter((s) => s.products.length > 0);

  return (
    <Container className="py-4">
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "전체 제품", href: "/products" },
          { label: category.name },
        ]}
      />

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-1.5 h-10 rounded-full bg-current ${colors.text}`} />
          <h1 className="text-3xl font-bold text-slate-900">{category.name}</h1>
        </div>
        <p className="text-slate-500 ml-5">
          {activeSeries.length}개 시리즈 &middot; {productCount}개 제품
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeSeries.map((s) => (
          <SeriesCard key={s.series_cate} series={s} categoryId={category.id} />
        ))}
      </div>
    </Container>
  );
}
