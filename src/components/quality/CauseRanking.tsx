import Link from "next/link";

export interface RankRow { key: string; count: number; percent: number }

interface Props {
  title: string;
  rows: RankRow[];
  hrefBuilder?: (key: string) => string;
}

export default function CauseRanking({ title, rows, hrefBuilder }: Props) {
  const max = rows[0]?.percent ?? 0;
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 font-semibold">{title}</div>
      {rows.length === 0 ? (
        <div className="px-4 py-12 text-center text-slate-500 text-sm">데이터 없음</div>
      ) : (
        <ol className="divide-y divide-slate-100">
          {rows.map((r, i) => {
            const w = max > 0 ? Math.round((r.percent / max) * 100) : 0;
            const content = (
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-right text-slate-400 text-sm">{i + 1}</span>
                <span className="flex-1 font-medium truncate">{r.key}</span>
                <span className="w-16 text-right text-sm tabular-nums">{r.count}건</span>
                <span className="w-16 text-right text-sm tabular-nums text-slate-500">{r.percent}%</span>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
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
      )}
    </div>
  );
}
