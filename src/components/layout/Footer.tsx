import Container from "@/components/ui/Container";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-slate-400 mt-20">
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center font-bold text-white text-xs">
                ODP
              </div>
              <span className="text-white font-bold">(주)오디피</span>
            </div>
            <p className="text-sm leading-relaxed">
              전력 변환 솔루션 전문기업<br />
              DC-DC, AC-DC 컨버터 설계 및 제조
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">제품</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/DCDC" className="hover:text-white transition-colors">DCDC Converter</Link></li>
              <li><Link href="/products/POL" className="hover:text-white transition-colors">POL (Point of Load)</Link></li>
              <li><Link href="/products/ACDC" className="hover:text-white transition-colors">ACDC / SMPS</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">연락처</h3>
            <ul className="space-y-2 text-sm">
              <li>전화: 031-445-7488</li>
              <li>경기도 안양시</li>
              <li>
                <a
                  href="https://www.odpcorp.co.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  www.odpcorp.co.kr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 text-center text-xs">
          &copy; {new Date().getFullYear()} ODP Corp. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
