import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import OutputTable from "@/components/product/OutputTable";
import { CertBadges } from "@/components/ui/Badge";
import { getProductByModel, getAllModels, CATEGORY_COLORS } from "@/lib/catalog";
import { formatPower, getInputVoltage } from "@/types/product";

interface Props {
  params: { model: string };
}

export function generateStaticParams() {
  return getAllModels().map((model) => ({ model }));
}

export function generateMetadata({ params }: Props): Metadata {
  const result = getProductByModel(params.model);
  if (!result) return {};
  return {
    title: `${result.product.model} - ${result.series.series_name}`,
    description: `${result.product.model} ${formatPower(result.product)} - ${result.series.description}`,
  };
}

export default function ProductDetailPage({ params }: Props) {
  const result = getProductByModel(params.model);
  if (!result) notFound();

  const { product, series, category } = result;
  const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.DCDC;
  const siblings = series.products.filter((p) => p.model !== product.model);

  return (
    <Container className="py-4">
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: category.name, href: `/products/${category.id}` },
          { label: series.series_name, href: `/products/${category.id}/${series.series_cate}` },
          { label: product.model },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center">
          <Image
            src={product.image_url}
            alt={product.model}
            width={320}
            height={320}
            className="object-contain"
            unoptimized
          />
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-lg ${colors.bg} ${colors.text}`}>
              {category.name}
            </span>
            <span className="text-sm text-slate-400">{series.series_name}</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 font-mono mb-1">{product.model}</h1>

          {"model_dual" in product && product.model_dual && (
            <p className="text-sm text-slate-500 mb-3">
              이중출력 모델: <span className="font-mono font-medium">{product.model_dual}</span>
            </p>
          )}

          <div className="text-2xl font-mono font-bold text-accent-blue mb-6">{formatPower(product)}</div>

          {/* Specs */}
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">입력전압</h3>
              <div className="space-y-1">
                {getInputVoltage(product).map((v, i) => (
                  <div key={i} className="inline-block mr-3 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-mono">
                    {v}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">인증</h3>
              <CertBadges certs={product.certifications} />
            </div>

            <a
              href={product.detail_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent-blue hover:underline"
            >
              원본 제품 페이지 보기
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Part Numbers */}
      {product.parts_detail && product.parts_detail.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-1">개별 모델 (파트넘버)</h2>
          <p className="text-sm text-slate-500 mb-4">총 {product.parts_detail.length}개 모델</p>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="text-left py-2.5 px-4 font-semibold text-slate-700">파트넘버</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-slate-700">입력전압</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-slate-700">출력전압</th>
                  </tr>
                </thead>
                <tbody>
                  {product.parts_detail.map((part, i) => (
                    <tr key={part.part_number} className={`border-b border-slate-100 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                      <td className="py-2 px-4 font-mono font-medium text-slate-900">{part.part_number}</td>
                      <td className="py-2 px-4 font-mono text-slate-600">{part.input_voltage}</td>
                      <td className="py-2 px-4 font-mono text-slate-600">{part.output_voltage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Output Options */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-4">출력 사양</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <OutputTable options={product.output_options} />
        </div>
      </section>

      {/* Series Features */}
      {series.features && series.features.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">시리즈 특징</h2>
          <div className="bg-slate-50 rounded-xl p-6">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {series.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-current ${colors.text} flex-shrink-0`} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Siblings */}
      {siblings.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">이 시리즈의 다른 제품</h2>
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link
                key={s.model}
                href={`/products/detail/${s.model}`}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-mono hover:border-accent-blue hover:text-accent-blue transition-colors"
              >
                {s.model}
                <span className="text-slate-400 ml-1.5">{formatPower(s)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
