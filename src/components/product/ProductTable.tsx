import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPower, getInputVoltage } from "@/types/product";
import { CertBadges } from "@/components/ui/Badge";
import ProductImage from "@/components/product/ProductImage";

interface ProductTableProps {
  products: Product[];
  categoryId: string;
}

export default function ProductTable({ products, categoryId }: ProductTableProps) {
  if (products.length === 0) return <p className="text-slate-500 py-8 text-center">등록된 제품이 없습니다.</p>;

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-700">제품</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">모델명</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">용량</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">입력전압</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">출력</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">파트넘버</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">인증</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.model} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <Link href={`/products/detail/${p.model}`}>
                    <ProductImage
                      src={p.image_url}
                      alt={p.model}
                      width={64}
                      height={64}
                      className="object-contain rounded"
                    />
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <Link href={`/products/detail/${p.model}`} className="font-mono font-semibold text-accent-blue hover:underline">
                    {p.model}
                  </Link>
                  {"model_dual" in p && p.model_dual && (
                    <div className="text-xs text-slate-400 mt-0.5">이중출력: {p.model_dual}</div>
                  )}
                </td>
                <td className="py-3 px-4 font-mono font-medium">{formatPower(p)}</td>
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    {getInputVoltage(p).map((v, i) => (
                      <div key={i} className="text-xs text-slate-600">{v}</div>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    {p.output_options.slice(0, 3).map((o, i) => (
                      <div key={i} className="text-xs text-slate-600">
                        {o.voltage} / {o.current}
                      </div>
                    ))}
                    {p.output_options.length > 3 && (
                      <div className="text-xs text-slate-400">+{p.output_options.length - 3}개</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {p.part_numbers && p.part_numbers.length > 0 ? (
                    <span className="font-medium text-slate-700">{p.part_numbers.length}개</span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <CertBadges certs={p.certifications} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {products.map((p) => (
          <Link key={p.model} href={`/products/detail/${p.model}`}>
            <div className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <ProductImage
                  src={p.image_url}
                  alt={p.model}
                  width={56}
                  height={56}
                  className="object-contain rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-accent-blue">{p.model}</span>
                    <span className="font-mono text-sm text-slate-700">{formatPower(p)}</span>
                  </div>
                  {"model_dual" in p && p.model_dual && (
                    <div className="text-xs text-slate-400 mb-1">이중출력: {p.model_dual}</div>
                  )}
                  <div className="text-xs text-slate-500 mb-2">
                    {getInputVoltage(p).join(" | ")}
                  </div>
                  <CertBadges certs={p.certifications} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
