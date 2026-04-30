"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import Container from "@/components/ui/Container";
import Combobox from "@/components/quality/Combobox";
import CauseRanking from "@/components/quality/CauseRanking";
import { useCatalogLookup } from "@/components/quality/useCatalogLookup";

type Tab = "causes" | "model" | "global";

function StatsPageInner() {
  const sp = useSearchParams();
  const router = useRouter();
  // URL에서 직접 derive — Link 클릭으로 URL이 바뀌어도 즉시 반영
  const tab: Tab = (sp.get("tab") as Tab) || "model";

  function setTabAndPush(t: Tab) {
    // 각 탭은 자기만의 prefix(m_*, c_*)를 쓰므로 그대로 보존하면
    // 탭을 옮겼다가 돌아와도 이전 검색 상태가 유지된다.
    const q = new URLSearchParams(sp.toString());
    q.set("tab", t);
    router.replace(`/quality/stats?${q.toString()}`);
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">통계</h1>
        <Link href="/quality" className="text-sm text-slate-500 hover:text-slate-700">← 목록으로</Link>
      </div>
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <TabBtn active={tab === "model"} onClick={() => setTabAndPush("model")}>모델별 통계</TabBtn>
        <TabBtn active={tab === "causes"} onClick={() => setTabAndPush("causes")}>부적합 통계</TabBtn>
        <TabBtn active={tab === "global"} onClick={() => setTabAndPush("global")}>전체 통계</TabBtn>
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

interface DefectData {
  defect: string;
  model: string | null;
  total: number;
  recent30: number;
  modelCount: number;
  topModel: string | null;
  range: { from: string | null; to: string | null };
  monthly: { month: string; count: number }[];
  topModels: { key: string; count: number; percent: number }[];
  topCauses: { key: string; count: number; percent: number }[];
  topActions: { key: string; count: number; percent: number }[];
  recentRows: { nc_no: string; written_date: string; model_name: string; cause: string | null; action: string | null }[];
}

function CausesTab() {
  const sp = useSearchParams();
  const router = useRouter();
  const [defect, setDefect] = useState(sp.get("c_defect") ?? "");
  const [model, setModel] = useState(sp.get("c_model") ?? "");
  const [opts, setOpts] = useState({ models: [] as string[], defects: [] as string[] });
  const [d, setD] = useState<DefectData | null>(null);

  useEffect(() => {
    const url = `/api/quality/options${model ? `?model=${encodeURIComponent(model)}` : ""}`;
    fetch(url).then((r) => r.json()).then((o) => setOpts({ models: o.models, defects: o.defects }));
  }, [model]);

  function search() {
    if (!defect) { setD(null); return; }
    const q = new URLSearchParams();
    q.set("defect", defect);
    if (model) q.set("model", model);
    fetch(`/api/quality/stats/defect?${q.toString()}`).then((r) => r.json()).then(setD);
    // URL은 prefix 형태로 보존
    const url = new URLSearchParams(sp.toString());
    url.set("tab", "causes");
    url.set("c_defect", defect);
    if (model) url.set("c_model", model);
    else url.delete("c_model");
    router.replace(`/quality/stats?${url.toString()}`);
  }

  // URL 진입 시 자동 조회
  useEffect(() => {
    if (sp.get("c_defect")) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentModels = useCatalogLookup(d?.recentRows.map((r) => r.model_name) ?? []);
  const focusedModelMeta = useCatalogLookup(model ? [model] : []);

  const causeHref = (cause: string) => {
    const q = new URLSearchParams({ defect });
    if (model) q.set("model", model);
    q.set("cause", cause);
    return `/quality?${q.toString()}`;
  };
  const modelHref = (m: string) => `/quality/stats?tab=model&m_model=${encodeURIComponent(m)}`;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-3 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium block">부적합 내용 *</label>
          <Combobox value={defect} onChange={setDefect} onEnter={search} options={opts.defects} placeholder="예: 입력쇼트" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium block">모델명 (선택)</label>
          <Combobox value={model} onChange={setModel} onEnter={search} options={opts.models} placeholder="비워두면 전체" />
        </div>
        <button onClick={search} disabled={!defect} className="px-5 py-2 text-sm rounded-lg bg-navy text-white disabled:opacity-50">조회</button>
      </div>

      {d && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-md bg-slate-100 font-medium">{d.defect}</span>
            {d.model ? (
              <>
                <span className="text-slate-400">∩</span>
                <span className="px-2 py-1 rounded-md bg-slate-100 font-medium font-mono">{d.model}</span>
                {focusedModelMeta[d.model] && (
                  <Link href={`/products/detail/${focusedModelMeta[d.model].series_model}`}
                        className="text-accent-blue hover:underline">제품 상세 →</Link>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-500">모든 모델</span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card label="총 건수" value={d.total.toLocaleString()} />
            <Card label="최근 30일" value={d.recent30.toLocaleString()} />
            <Card label={d.model ? "최다 원인" : "발생 모델 수"}
                  value={d.model ? (d.topCauses[0]?.key ?? "-") : d.modelCount.toLocaleString()} />
            <Card label="최다 모델" value={d.topModel ?? "-"} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="font-semibold mb-2">월별 추이 (최근 12개월)</div>
            <MonthlyChart data={d.monthly} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CauseRanking title="부적합 원인 TOP 5" rows={d.topCauses} initialLimit={5} hrefBuilder={causeHref} />
            <CauseRanking title="조치사항 TOP 5" rows={d.topActions} initialLimit={5} />
          </div>

          {!d.model && (
            <CauseRanking title="발생 모델 TOP 10" rows={d.topModels} initialLimit={10} hrefBuilder={modelHref} />
          )}

          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold">최근 이력 10건</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="px-3 py-2 text-left">NC</th>
                <th className="px-3 py-2 text-left">일자</th>
                <th className="px-3 py-2 text-left">모델명</th>
                <th className="px-3 py-2 text-left">원인</th>
                <th className="px-3 py-2 text-left">조치</th>
              </tr></thead>
              <tbody>{d.recentRows.map((r) => (
                <tr key={r.nc_no} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono">
                    <Link className="text-accent-blue hover:underline" href={`/quality/${r.nc_no}`}>{r.nc_no}</Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.written_date}</td>
                  <td className="px-3 py-2">
                    {recentModels[r.model_name] ? (
                      <Link href={`/products/detail/${recentModels[r.model_name].series_model}`}
                            className="text-accent-blue hover:underline">{r.model_name}</Link>
                    ) : r.model_name}
                  </td>
                  <td className="px-3 py-2">{r.cause ?? "-"}</td>
                  <td className="px-3 py-2">{r.action ?? "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
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
  const [model, setModel] = useState(sp.get("m_model") ?? "");
  const [appliedModel, setAppliedModel] = useState<string>(sp.get("m_model") ?? "");
  const [opts, setOpts] = useState<string[]>([]);
  const [d, setD] = useState<ModelData | null>(null);

  useEffect(() => { fetch("/api/quality/options").then((r) => r.json()).then((o) => setOpts(o.models)); }, []);

  function search() {
    if (!model) { setD(null); setAppliedModel(""); return; }
    fetch(`/api/quality/stats/model?model=${encodeURIComponent(model)}`).then((r) => r.json()).then(setD);
    setAppliedModel(model);
    const q = new URLSearchParams(sp.toString());
    q.set("tab", "model");
    q.set("m_model", model);
    router.replace(`/quality/stats?${q.toString()}`);
  }

  // URL 진입 시 자동 조회
  useEffect(() => {
    if (sp.get("m_model")) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 카탈로그 lookup은 적용된 모델 기준으로만 (검색어 입력 중 실시간 호출 방지)
  const catalog = useCatalogLookup(appliedModel ? [appliedModel] : []);
  const meta = catalog[appliedModel];
  return (
    <div className="space-y-6">
      {/* 검색 바: 위치 고정 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-[1fr_auto] gap-3 items-center max-w-2xl">
        <Combobox value={model} onChange={setModel} onEnter={search} options={opts} placeholder="모델명 선택" />
        <button onClick={search} disabled={!model} className="px-5 py-2 text-sm rounded-lg bg-navy text-white disabled:opacity-50">조회</button>
      </div>
      {d && (
        <>
          {appliedModel && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded-md bg-slate-100 font-mono font-medium">{appliedModel}</span>
              {meta && (
                <>
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    meta.category_id === "DCDC" ? "bg-blue-50 text-accent-blue" :
                    meta.category_id === "POL"  ? "bg-teal-50 text-accent-teal" :
                    meta.category_id === "ACDC" ? "bg-amber-50 text-accent-amber" :
                    "bg-slate-100 text-slate-600"}`}>{meta.category_id}</span>
                  <span className="text-slate-500">{meta.series_name}</span>
                  <Link href={`/products/detail/${meta.series_model}`}
                        className="text-accent-blue hover:underline">제품 상세 →</Link>
                </>
              )}
            </div>
          )}
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
            <CauseRanking
              title="부적합 내용 TOP 5"
              rows={d.topDefects}
              initialLimit={5}
              hrefBuilder={(defect) => `/quality/stats?tab=causes&c_defect=${encodeURIComponent(defect)}&c_model=${encodeURIComponent(appliedModel)}`}
            />
            <CauseRanking
              title="부적합 원인 TOP 5"
              rows={d.topCauses}
              initialLimit={5}
              hrefBuilder={(cause) => `/quality?model=${encodeURIComponent(appliedModel)}&cause=${encodeURIComponent(cause)}`}
            />
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
  topDefects: { key: string; count: number; percent: number }[];
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
      <CauseRanking
        title="부적합 많은 모델 TOP 10"
        rows={d.topModels}
        initialLimit={10}
        hrefBuilder={(m) => `/quality/stats?tab=model&m_model=${encodeURIComponent(m)}`}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CauseRanking
          title="부적합 내용 TOP 10"
          rows={d.topDefects}
          initialLimit={10}
          hrefBuilder={(defect) => `/quality/stats?tab=causes&c_defect=${encodeURIComponent(defect)}`}
        />
        <CauseRanking title="부적합 원인 TOP 10" rows={d.topCauses} initialLimit={10} />
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
