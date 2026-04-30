"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import PasswordModal, { getStoredPassword, setStoredPassword, clearStoredPassword } from "@/components/quality/PasswordModal";

interface ImportResp {
  inserted: number; updated: number; skipped: number;
  errors: { row: number; reason: string }[]; total: number;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function call(pw: string) {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/quality/import", { method: "POST", headers: { "x-quality-password": pw }, body: fd });
      if (res.status === 401) { clearStoredPassword(); throw new Error("비밀번호가 올바르지 않습니다."); }
      if (!res.ok) throw new Error((await res.json()).error || "업로드 실패");
      setResult(await res.json());
    } catch (e) {
      setErr((e as Error).message);
      throw e;
    } finally { setBusy(false); }
  }

  async function onUpload() {
    if (!file) return;
    const stored = getStoredPassword();
    if (stored) {
      try { await call(stored); return; }
      catch (e) {
        if (!(e instanceof Error && e.message.includes("비밀번호"))) return;
      }
    }
    setPwOpen(true);
  }

  function downloadErrors() {
    if (!result) return;
    const csv = ["row,reason", ...result.errors.map((e) => `${e.row},"${e.reason.replace(/"/g, '""')}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "import-errors.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Container className="py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">엑셀 업로드</h1>
        <Link href="/quality" className="text-sm text-slate-500 hover:text-slate-700">← 목록으로</Link>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <p className="text-sm text-slate-600">
          업로드 시 <b>부적합품 번호</b> 기준으로 upsert(있으면 갱신, 없으면 신규)됩니다.
          시트명이 <code>부적합품 관리 대장</code>이면 자동 인식하며, 없으면 첫 시트를 사용합니다.
        </p>
        <input type="file" accept=".xlsx,.xls"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setErr(null); }}
          className="block text-sm" />
        <div className="flex justify-end gap-2">
          <button disabled={!file || busy} onClick={onUpload} className="px-5 py-2 text-sm rounded-lg bg-navy text-white disabled:opacity-50">
            {busy ? "업로드 중…" : "업로드 실행"}
          </button>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {result && (
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="신규" value={result.inserted} tone="emerald" />
              <Stat label="갱신" value={result.updated} tone="sky" />
              <Stat label="스킵(에러)" value={result.skipped} tone="amber" />
            </div>
            {result.errors.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold">에러 행 ({result.errors.length})</h3>
                  <button onClick={downloadErrors} className="text-xs text-accent-blue">CSV 다운로드</button>
                </div>
                <div className="max-h-60 overflow-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left">행</th><th className="px-3 py-2 text-left">사유</th></tr></thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} className="border-t border-slate-100"><td className="px-3 py-1.5">{e.row}</td><td className="px-3 py-1.5">{e.reason}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PasswordModal open={pwOpen} onClose={() => setPwOpen(false)} onConfirm={async (pw) => {
        await call(pw); setStoredPassword(pw); setPwOpen(false);
      }} />
    </Container>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "sky" | "amber" }) {
  const cls = { emerald: "bg-emerald-50 text-emerald-700", sky: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700" }[tone];
  return (
    <div className={`rounded-lg p-4 ${cls}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
