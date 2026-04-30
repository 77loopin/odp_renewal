"use client";
import Link from "next/link";
import SourceBadge from "./SourceBadge";
import ModelLink from "./ModelLink";
import { useCatalogLookup } from "./useCatalogLookup";
import type { NonConformance } from "@/lib/quality/types";

interface Props {
  rows: NonConformance[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export default function NCTable({ rows, total, page, pageSize, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const catalog = useCatalogLookup(rows.map((r) => r.model_name));
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">NC번호</th>
              <th className="px-3 py-2 text-left">일자</th>
              <th className="px-3 py-2 text-left">모델명</th>
              <th className="px-3 py-2 text-left">LOT</th>
              <th className="px-3 py-2 text-left">부적합 내용</th>
              <th className="px-3 py-2 text-left">원인</th>
              <th className="px-3 py-2 text-left">조치</th>
              <th className="px-3 py-2 text-left">처리결과</th>
              <th className="px-3 py-2 text-left">처리자</th>
              <th className="px-3 py-2 text-left">소스</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-12 text-center text-slate-500">검색 조건과 일치하는 부적합 이력이 없습니다.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.nc_no} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono">
                  <Link className="text-accent-blue hover:underline" href={`/quality/${r.nc_no}`}>{r.nc_no}</Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{r.written_date}</td>
                <td className="px-3 py-2"><ModelLink model={r.model_name} meta={catalog[r.model_name]} /></td>
                <td className="px-3 py-2">{r.lot_no ?? "-"}</td>
                <td className="px-3 py-2">{r.defect}</td>
                <td className="px-3 py-2">{r.cause ?? "-"}</td>
                <td className="px-3 py-2">{r.action ?? "-"}</td>
                <td className="px-3 py-2">{r.result ?? "-"}</td>
                <td className="px-3 py-2">{r.handler ?? "-"}</td>
                <td className="px-3 py-2"><SourceBadge source={r.source} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
        <span className="text-slate-500">총 {total.toLocaleString()}건</span>
        <div className="flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40">이전</button>
          <span className="px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40">다음</button>
        </div>
      </div>
    </div>
  );
}
