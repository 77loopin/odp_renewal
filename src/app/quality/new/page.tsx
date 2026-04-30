"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import NCForm, { NCFormValue } from "@/components/quality/NCForm";
import PasswordModal, { getStoredPassword, setStoredPassword, clearStoredPassword } from "@/components/quality/PasswordModal";

export default function NewQualityPage() {
  const router = useRouter();
  const [pendingValue, setPendingValue] = useState<NCFormValue | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  async function trySubmit(v: NCFormValue, password: string) {
    const res = await fetch("/api/quality", {
      method: "POST",
      headers: { "content-type": "application/json", "x-quality-password": password },
      body: JSON.stringify(v),
    });
    if (res.status === 401) { clearStoredPassword(); throw new Error("비밀번호가 올바르지 않습니다."); }
    if (!res.ok) { throw new Error((await res.json()).error || "등록 실패"); }
    const created = await res.json();
    router.push(`/quality/${created.nc_no}`);
  }

  async function onSubmit(v: NCFormValue) {
    const stored = getStoredPassword();
    if (stored) {
      try { await trySubmit(v, stored); return; }
      catch (e) {
        if (!(e instanceof Error && e.message.includes("비밀번호"))) {
          alert((e as Error).message);
          return;
        }
      }
    }
    setPendingValue(v);
    setPwOpen(true);
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">신규 부적합품 등록</h1>
        <Link href="/quality" className="text-sm text-slate-500 hover:text-slate-700">← 목록으로</Link>
      </div>
      <NCForm submitLabel="등록" onSubmit={onSubmit} />
      <PasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onConfirm={async (pw) => {
          if (!pendingValue) return;
          await trySubmit(pendingValue, pw);
          setStoredPassword(pw);
          setPwOpen(false);
        }}
      />
    </Container>
  );
}
