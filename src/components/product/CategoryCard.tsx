import Link from "next/link";
import type { Category } from "@/types/product";
import { getCategoryProductCount, CATEGORY_COLORS } from "@/lib/catalog";

const CATEGORY_DESC: Record<string, string> = {
  DCDC: "DC 입력을 다양한 DC 출력으로 변환하는 고효율 절연형 컨버터",
  POL: "보드 실장형 비절연 강압 DC-DC 컨버터",
  ACDC: "AC 전원을 안정적인 DC 출력으로 변환하는 SMPS 전원장치",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  DCDC: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  POL: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  ACDC: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
};

export default function CategoryCard({ category }: { category: Category }) {
  const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.DCDC;
  const productCount = getCategoryProductCount(category);

  return (
    <Link href={`/products/${category.id}`} className="block h-full">
      <div className={`group relative h-full flex flex-col rounded-2xl border-2 ${colors.accent} ${colors.bg} p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
        <div className={`${colors.text} mb-4`}>
          {CATEGORY_ICONS[category.id]}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1">{category.name}</h3>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed flex-1">
          {CATEGORY_DESC[category.id]}
        </p>
        <div className="flex items-center justify-between text-sm mt-auto">
          <span className="text-slate-500">
            {category.series.length}개 시리즈 &middot; {productCount}개 제품
          </span>
          <span className={`${colors.text} font-medium group-hover:translate-x-1 transition-transform`}>
            보기 &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
