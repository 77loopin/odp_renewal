"use client";
import Link from "next/link";
import { useState } from "react";

export interface RankRow { key: string; count: number; percent: number }

interface Props {
  title: string;
  rows: RankRow[];
  hrefBuilder?: (key: string) => string;
  /** 처음에 보여줄 행 수. 지정하지 않으면 전체. rows.length 가 더 크면 '더보기' 버튼 표시 */
  initialLimit?: number;
}

export default function CauseRanking({ title, rows, hrefBuilder, initialLimit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const max = rows[0]?.percent ?? 0;
  const showLimit = expanded || initialLimit === undefined ? rows.length : Math.min(initialLimit, rows.length);
  const visible = rows.slice(0, showLimit);
  const hasMore = initialLimit !== undefined && rows.length > initialLimit;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 font-semibold">{title}</div>
      {rows.length === 0 ? (
        <div className="px-4 py-12 text-center text-slate-500 text-sm">데이터 없음</div>
      ) : (
        <>
          <div
            className={`overflow-x-auto ${expanded ? "overflow-y-auto" : ""}`}
            style={
              expanded
                // 펼친 영역 높이는 collapsed 상태(initialLimit 행)의 약 1.05배. 그 이상은 내부 세로 스크롤.
                ? { maxHeight: `${Math.max(420, (initialLimit ?? 10) * 56 * 1.05)}px` }
                : undefined
            }
          >
            <ol className="divide-y divide-slate-100 min-w-max">
              {visible.map((r, i) => {
                const w = max > 0 ? Math.round((r.percent / max) * 100) : 0;
                const content = (
                  // 반응형:
                  //   - 모바일(default): 순위 + 항목 + 건수 + %
                  //   - md 이상       : + 게이지 바
                  // 항목명이 너무 길면 truncate 대신 가로 스크롤(부모 div).
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
                    <span className="w-6 shrink-0 text-right text-slate-400 text-sm">{i + 1}</span>
                    <span className="flex-1 font-medium whitespace-nowrap">{r.key}</span>
                    <span className="w-14 shrink-0 text-right text-sm tabular-nums">{r.count}건</span>
                    <span className="w-12 shrink-0 text-right text-sm tabular-nums text-slate-500">{r.percent}%</span>
                    <div className="hidden md:block w-20 shrink-0 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-blue" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
                return (
                  <li key={r.key} className="hover:bg-slate-50">
                    {hrefBuilder ? <Link href={hrefBuilder(r.key)}>{content}</Link> : content}
                  </li>
                );
              })}
            </ol>
          </div>
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full px-4 py-2.5 text-sm text-accent-blue hover:bg-slate-50 border-t border-slate-100"
            >
              {expanded ? `접기 (TOP ${initialLimit}만 보기)` : `더보기 (+${rows.length - initialLimit!}개)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
