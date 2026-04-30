"use client";
import { useEffect, useState } from "react";
import Combobox from "./Combobox";

export interface FilterState {
  q: string; model: string; defect: string; cause: string; action: string;
  lot: string; from: string; to: string;
}

interface Props {
  initial: FilterState;
  options: { models: string[]; defects: string[]; causes: string[]; actions: string[] };
  onSubmit: (f: FilterState) => void;
}

export default function FilterBar({ initial, options, onSubmit }: Props) {
  const [f, setF] = useState<FilterState>(initial);
  useEffect(() => setF(initial), [initial]);

  function submit(next: Partial<FilterState> = {}) {
    const merged = { ...f, ...next };
    setF(merged);
    onSubmit(merged);
  }
  function reset() {
    const empty: FilterState = { q: "", model: "", defect: "", cause: "", action: "", lot: "", from: "", to: "" };
    setF(empty); onSubmit(empty);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="통합검색 (모델/원인/조치/처리자/번호 등)"
          className="md:col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input value={f.lot} onChange={(e) => setF({ ...f, lot: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="LOT 번호" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm" />
          <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Combobox value={f.model}  onChange={(v) => setF({ ...f, model: v })}  onEnter={() => submit()} options={options.models}  placeholder="모델명" />
        <Combobox value={f.defect} onChange={(v) => setF({ ...f, defect: v })} onEnter={() => submit()} options={options.defects} placeholder="부적합 내용" />
        <Combobox value={f.cause}  onChange={(v) => setF({ ...f, cause: v })}  onEnter={() => submit()} options={options.causes}  placeholder="부적합 원인" />
        <Combobox value={f.action} onChange={(v) => setF({ ...f, action: v })} onEnter={() => submit()} options={options.actions} placeholder="조치사항" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={reset} className="px-4 py-2 text-sm rounded-lg border border-slate-300">초기화</button>
        <button onClick={() => submit()} className="px-4 py-2 text-sm rounded-lg bg-navy text-white">검색</button>
      </div>
    </div>
  );
}
