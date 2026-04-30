"use client";
import { useEffect, useState } from "react";
import Combobox from "./Combobox";
import type { NonConformance } from "@/lib/quality/types";

interface Props {
  initial?: Partial<NonConformance>;
  submitLabel: string;
  onSubmit: (input: NCFormValue) => Promise<void> | void;
}

export interface NCFormValue {
  written_date: string; model_name: string; lot_no: string;
  defect: string; cause: string; action: string; result: string; handler: string;
}

export default function NCForm({ initial, submitLabel, onSubmit }: Props) {
  const [v, setV] = useState<NCFormValue>({
    written_date: initial?.written_date ?? new Date().toISOString().slice(0, 10),
    model_name: initial?.model_name ?? "",
    lot_no: initial?.lot_no ?? "",
    defect: initial?.defect ?? "",
    cause: initial?.cause ?? "",
    action: initial?.action ?? "",
    result: initial?.result ?? "",
    handler: initial?.handler ?? "",
  });
  const [opts, setOpts] = useState({ models: [] as string[], defects: [] as string[], causes: [] as string[], actions: [] as string[], handlers: [] as string[] });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/quality/options${v.model_name ? `?model=${encodeURIComponent(v.model_name)}` : ""}`)
      .then((r) => r.json())
      .then(setOpts);
  }, [v.model_name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.model_name.trim()) return alert("모델명은 필수입니다.");
    if (!v.defect.trim()) return alert("부적합 내용은 필수입니다.");
    setBusy(true);
    try { await onSubmit(v); } finally { setBusy(false); }
  }

  const field = "border border-slate-300 rounded-lg px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 block"><span className="text-sm font-medium">작성일자 *</span>
          <input type="date" required value={v.written_date} onChange={(e) => setV({ ...v, written_date: e.target.value })} className={`w-full ${field}`} />
        </label>
        <div className="space-y-1"><label className="text-sm font-medium block">모델명 *</label>
          <Combobox value={v.model_name} onChange={(x) => setV({ ...v, model_name: x })} options={opts.models} placeholder="예: SDS6-24-12" />
        </div>
        <label className="space-y-1 block"><span className="text-sm font-medium">LOT 번호</span>
          <input value={v.lot_no} onChange={(e) => setV({ ...v, lot_no: e.target.value })} className={`w-full ${field}`} />
        </label>
        <div className="space-y-1"><label className="text-sm font-medium block">처리자</label>
          <Combobox value={v.handler} onChange={(x) => setV({ ...v, handler: x })} options={opts.handlers} />
        </div>
        <div className="space-y-1 md:col-span-2"><label className="text-sm font-medium block">부적합 내용 *</label>
          <Combobox value={v.defect} onChange={(x) => setV({ ...v, defect: x })} options={opts.defects} placeholder="예: 출력없음" />
        </div>
        <div className="space-y-1"><label className="text-sm font-medium block">부적합 원인</label>
          <Combobox value={v.cause} onChange={(x) => setV({ ...v, cause: x })} options={opts.causes} />
        </div>
        <div className="space-y-1"><label className="text-sm font-medium block">조치사항</label>
          <Combobox value={v.action} onChange={(x) => setV({ ...v, action: x })} options={opts.actions} />
        </div>
        <label className="space-y-1 md:col-span-2 block"><span className="text-sm font-medium">처리결과</span>
          <input value={v.result} onChange={(e) => setV({ ...v, result: e.target.value })} className={`w-full ${field}`} />
        </label>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm rounded-lg bg-navy text-white disabled:opacity-50">
          {busy ? "처리 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
