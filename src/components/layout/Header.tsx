"use client";

import Link from "next/link";
import { useState } from "react";
import Container from "@/components/ui/Container";

const NAV_ITEMS = [
  { label: "홈", href: "/" },
  { label: "제품", href: "/products" },
  { label: "품질관리", href: "/quality" },
  { label: "회사소개", href: "/about" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg">
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-blue flex items-center justify-center font-bold text-sm">
              ODP
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold tracking-tight">ODP Corp</div>
              <div className="text-[11px] text-slate-400 -mt-0.5">Power Conversion Solutions</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/search"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-light text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              검색
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </Container>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-navy-dark">
          <Container>
            <div className="py-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-2 text-sm text-slate-300 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/search"
                className="block py-2 text-sm text-slate-300 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                검색
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
