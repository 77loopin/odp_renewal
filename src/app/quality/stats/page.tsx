"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import Container from "@/components/ui/Container";
import Combobox from "@/components/quality/Combobox";
import CauseRanking from "@/components/quality/CauseRanking";

type Tab = "causes" | "model" | "global";

function StatsPageInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "causes");

  function setTabAndPush(t: Tab) {
    setTab(t);
    const q = new URLSearchParams(sp.toString()); q.set("tab", t);
    router.replace(`/quality/stats?${q.toString()}`);
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">통계</h1>
        <Link href="/quality" className="text-sm text-slate-500 hover:text-slate-700">← 목록으로</Link>
      </div>
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <TabBtn active={tab === "causes"} onClick={() => setTabAndPush("causes")} highlight>원인 랭킹</TabBtn>
        <TabBtn active={tab === "model"} onClick={() => setTabAndPush("model")}>모델 대시보드</TabBtn>
        <TabBtn active={tab === "global"} onClick={() => setTabAndPush("global")}>전사 대시보드</TabBtn>
      </div>
      {tab === "causes" && <CausesTab />}
      {tab === "model" && <ModelTab />}
      {tab === "global" && <GlobalTab />}
    </Container>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<Container className="py-8">로딩 중…</Container>}>
      <StatsPageInner />
    </Suspense>
  );
}

function TabBtn({ active, highlight, children, onClick }: { active: boolean; highlight?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium ${active ? "text-navy" : "text-slate-500"}`}>
      {children}
      {highlight && !active && <span className="absolute -top-1 -right-1 text-[10px] bg-accent-blue text-white rounded px-1">MAIN</span>}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />}
    </button>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1 truncate">{value}</div>
    </div>
  );
}

function MonthlyChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CausesData {
  total: number;
  range: { from: string | null; to: string | null };
  causes: { key: string; count: number; percent: number }[];
  actions: { key: string; count: number; percent: number }[];
}

function CausesTab() {
  const sp = useSearchParams();
  const router = useRouter();
  const [model, setModel] = useState(sp.get("model") ?? "");
  const [defect, setDefect] = useState(sp.get("defect") ?? "");
  const [opts, setOpts] = useState({ models: [] as string[], defects: [] as string[] });
  const [data, setData] = useState<CausesData | null>(null);

  useEffect(() => {
    const url = `/api/quality/options${model ? `?model=${encodeURIComponent(model)}` : ""}`;
    fetch(url).then((r) => r.json()).then((o) => setOpts({ models: o.models, defects: o.defects }));
  }, [model]);

  function search() {
    const queryUrl = new URLSearchParams();
    if (model) queryUrl.set("model", model);
    if (defect) queryUrl.set("defect", defect);
    fetch(`/api/quality/stats/causes?${queryUrl.toString()}`).then((r) => r.json()).then(setData);
    const q = new URLSearchParams({ tab: "causes" });
    if (model) q.set("model", model);
    if (defect) q.set("defect", defect);
    router.replace(`/quality/stats?${q.toString()}`);
  }

  useEffect(() => {
    if (sp.get("model") || sp.get("defect")) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hrefBuilder = (cause: string) => {
    const q = new URLSearchParams();
    if (model) q.set("model", model);
    if (defect) q.set("defect", defect);
    q.set("cause", cause);
    return `/quality?${q.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium block">모델명</label>
          <Combobox value={model} onChange={setModel} options={opts.models} placeholder="예: SDS6-24-12" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium block">부적합 내용</label>
          <Combobox value={defect} onChange={setDefect} options={opts.defects} placeholder="예: 입력쇼트" />
        </div>
        <button onClick={search} className="px-5 py-2 text-sm rounded-lg bg-navy text-white">조회</button>
      </div>
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div><div className="text-xs text-slate-500">총 건수</div><div className="text-3xl font-bold">{data.total.toLocaleString()}</div></div>
            <div><div className="text-xs text-slate-500">기간</div><div className="text-sm">{data.range.from ?? "-"} ~ {data.range.to ?? "-"}</div></div>
            <div><div className="text-xs text-slate-500">고유 원인 수</div><div className="text-2xl font-semibold">{data.causes.length}</div></div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <CauseRanking title="부적합 원인 랭킹" rows={data.causes} hrefBuilder={hrefBuilder} />
            <CauseRanking title="조치사항 랭킹" rows={data.actions} />
          </div>
        </div>
      )}
    </div>
  );
}

interface ModelData {
  total: number; recent30: number; uniqueLots: number; topDefect: string | null;
  monthly: { month: string; count: number }[];
  topDefects: { key: string; count: number; percent: number }[];
  topCauses: { key: string; count: number; percent: number }[];
  recentRows: { nc_no: string; written_date: string; defect: string; cause: string | null }[];
}

function ModelTab() {
  const sp = useSearchParams();
  const router = useRouter();
  const [model, setModel] = useState(sp.get("model") ?? "");
  const [opts, setOpts] = useState<string[]>([]);
  const [d, setD] = useState<ModelData | null>(null);

  useEffect(() => { fetch("/api/quality/options").then((r) => r.json()).then((o) => setOpts(o.models)); }, []);
  useEffect(() => {
    if (!model) { setD(null); return; }
    fetch(`/api/quality/stats/model?model=${encodeURIComponent(model)}`).then((r) => r.json()).then(setD);
    const q = new URLSearchParams(sp.toString()); q.set("tab", "model"); q.set("model", model);
    router.replace(`/quality/stats?${q.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 max-w-md">
        <Combobox value={model} onChange={setModel} options={opts} placeholder="모델명 선택" />
      </div>
      {d && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card label="총 부적합" value={d.total.toLocaleString()} />
            <Card label="최근 30일" value={d.recent30.toLocaleString()} />
            <Card label="고유 LOT" value={d.uniqueLots.toLocaleString()} />
            <Card label="최다 부적합" value={d.topDefect ?? "-"} />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="font-semibold mb-2">월별 추이 (최근 12개월)</div>
            <MonthlyChart data={d.monthly} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CauseRanking title="부적합 내용 TOP 5" rows={d.topDefects} />
            <CauseRanking title="부적합 원인 TOP 5" rows={d.topCauses} />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold">최근 이력 10건</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="px-3 py-2 text-left">NC</th><th className="px-3 py-2 text-left">일자</th>
                <th className="px-3 py-2 text-left">부적합 내용</th><th className="px-3 py-2 text-left">원인</th>
              </tr></thead>
              <tbody>{d.recentRows.map((r) => (
                <tr key={r.nc_no} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono">
                    <Link className="text-accent-blue hover:underline" href={`/quality/${r.nc_no}`}>{r.nc_no}</Link>
                  </td>
                  <td className="px-3 py-2">{r.written_date}</td>
                  <td className="px-3 py-2">{r.defect}</td>
                  <td className="px-3 py-2">{r.cause ?? "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

interface GlobalData {
  total: number; recent30: number; modelCount: number; handlerCount: number;
  topModels: { key: string; count: number; percent: number }[];
  topCauses: { key: string; count: number; percent: number }[];
  monthly: { month: string; count: number }[];
  sourceRatio: { source: "excel" | "web"; count: number }[];
}

function GlobalTab() {
  const [d, setD] = useState<GlobalData | null>(null);
  useEffect(() => { fetch("/api/quality/stats/global").then((r) => r.json()).then(setD); }, []);
  if (!d) return <div className="text-slate-500 text-sm">로딩 중…</div>;

  const PIE_COLORS = ["#10b981", "#0ea5e9"];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card label="전체 건수" value={d.total.toLocaleString()} />
        <Card label="최근 30일" value={d.recent30.toLocaleString()} />
        <Card label="모델 수" value={d.modelCount.toLocaleString()} />
        <Card label="처리자 수" value={d.handlerCount.toLocaleString()} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CauseRanking title="부적합 많은 모델 TOP 10" rows={d.topModels} />
        <CauseRanking title="부적합 원인 TOP 10 (전사)" rows={d.topCauses} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 lg:col-span-2">
          <div className="font-semibold mb-2">월별 추이 (최근 12개월)</div>
          <MonthlyChart data={d.monthly} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold mb-2">소스 비율</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.sourceRatio.map((r) => ({ name: r.source === "excel" ? "엑셀" : "수기", value: r.count }))}
                     dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {d.sourceRatio.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
