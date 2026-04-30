"use client";
import { useState } from "react";

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void> | void;
}

export default function PasswordModal({ open, title = "비밀번호 확인", onClose, onConfirm }: Props) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await onConfirm(pw);
      setPw("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "비밀번호 확인 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <input
          autoFocus type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="비밀번호" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">취소</button>
          <button type="submit" disabled={busy || !pw} className="px-4 py-2 text-sm rounded-lg bg-navy text-white disabled:opacity-50">
            {busy ? "확인 중…" : "확인"}
          </button>
        </div>
      </form>
    </div>
  );
}

const KEY = "quality-password";
export function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}
export function setStoredPassword(pw: string) { sessionStorage.setItem(KEY, pw); }
export function clearStoredPassword() { sessionStorage.removeItem(KEY); }
