import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getCompanyInfo, getAllCategories, getAllProductsFlat } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "회사소개",
};

export default function AboutPage() {
  const info = getCompanyInfo();
  const categories = getAllCategories();
  const totalProducts = getAllProductsFlat().length;
  const totalSeries = categories.reduce((sum, c) => sum + c.series.length, 0);

  return (
    <Container className="py-4">
      <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "회사소개" }]} />

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">회사소개</h1>

        <div className="bg-slate-50 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent-blue flex items-center justify-center text-white font-bold text-xl">
              ODP
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">(주)오디피</h2>
              <p className="text-slate-500">ODP Corp</p>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed mb-6">
            (주)오디피는 전력 변환 솔루션 전문기업으로, DC-DC 컨버터, POL(Point of Load),
            AC-DC SMPS 등 다양한 전원장치를 설계하고 제조하고 있습니다.
            고효율, 초소형, 고신뢰성을 핵심 가치로 산업용, 의료용, 통신용 등
            다양한 분야에 최적의 전력 변환 솔루션을 제공합니다.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-xl">
              <div className="text-2xl font-bold text-accent-blue">{totalProducts}</div>
              <div className="text-sm text-slate-500 mt-1">제품</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl">
              <div className="text-2xl font-bold text-accent-blue">{totalSeries}</div>
              <div className="text-sm text-slate-500 mt-1">시리즈</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl">
              <div className="text-2xl font-bold text-accent-blue">{categories.length}</div>
              <div className="text-sm text-slate-500 mt-1">카테고리</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">연락처</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {info.phone}
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                경기도 안양시
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a
                  href={info.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline"
                >
                  {info.website}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">주요 제품군</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-slate-700 w-36">{cat.name}</span>
                  <span className="text-slate-500">{cat.series.length}개 시리즈</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">인증</h3>
            <p className="text-sm text-slate-600">CB, CE, RoHS, Medical 등 국제 인증 보유</p>
          </div>
        </div>
      </div>
    </Container>
  );
}
