"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import FilterBar, { FilterState } from "@/components/quality/FilterBar";
import NCTable from "@/components/quality/NCTable";
import type { NCListResult } from "@/lib/quality/types";

function readFilters(sp: URLSearchParams): FilterState {
  return {
    q: sp.get("q") ?? "",
    model: sp.get("model") ?? "",
    defect: sp.get("defect") ?? "",
    cause: sp.get("cause") ?? "",
    action: sp.get("action") ?? "",
    lot: sp.get("lot") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
  };
}

function QualityPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => readFilters(new URLSearchParams(sp.toString())));
  const [page, setPage] = useState<number>(Number(sp.get("page")) || 1);
  const [data, setData] = useState<NCListResult | null>(null);
  const [options, setOptions] = useState({ models: [] as string[], defects: [] as string[], causes: [] as string[], actions: [] as string[] });

  useEffect(() => {
    fetch("/api/quality/options").then((r) => r.json()).then(setOptions);
  }, []);

  const fetchList = useCallback(async (f: FilterState, p: number) => {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    q.set("page", String(p));
    q.set("pageSize", "50");
    const res = await fetch(`/api/quality?${q.toString()}`);
    setData(await res.json());
  }, []);

  useEffect(() => { fetchList(filters, page); }, [fetchList, filters, page]);

  function applyFilters(f: FilterState) {
    setFilters(f); setPage(1);
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    router.replace(`/quality${q.toString() ? `?${q}` : ""}`);
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">품질관리</h1>
          <p className="text-sm text-slate-500 mt-1">부적합품 이력 검색 및 관리</p>
        </div>
        <div className="flex gap-2">
          <Link href="/quality/stats" className="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">통계</Link>
          <Link href="/quality/import" className="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">엑셀 업로드</Link>
          <Link href="/quality/new" className="px-4 py-2 text-sm rounded-lg bg-navy text-white hover:bg-navy-light">+ 신규 등록</Link>
        </div>
      </div>
      <div className="space-y-4">
        <FilterBar initial={filters} options={options} onSubmit={applyFilters} />
        {data && (
          <NCTable rows={data.rows} total={data.total} page={data.page} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </div>
    </Container>
  );
}

export default function QualityPage() {
  return (
    <Suspense fallback={<Container className="py-8">로딩 중…</Container>}>
      <QualityPageInner />
    </Suspense>
  );
}
