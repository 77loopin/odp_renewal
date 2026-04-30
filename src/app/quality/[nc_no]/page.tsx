"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import NCForm, { NCFormValue } from "@/components/quality/NCForm";
import SourceBadge from "@/components/quality/SourceBadge";
import PasswordModal, { getStoredPassword, setStoredPassword, clearStoredPassword } from "@/components/quality/PasswordModal";
import type { NonConformance } from "@/lib/quality/types";

type Pending = { kind: "patch"; value: NCFormValue } | { kind: "delete" };

export default function QualityDetailPage() {
  const params = useParams<{ nc_no: string }>();
  const router = useRouter();
  const [data, setData] = useState<NonConformance | null>(null);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/quality/${params.nc_no}`).then((r) => r.json()).then((d) => {
      if (d?.error) router.replace("/quality");
      else setData(d);
    });
  }, [params.nc_no, router]);

  async function callPatch(v: NCFormValue, pw: string) {
    const res = await fetch(`/api/quality/${params.nc_no}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-quality-password": pw },
      body: JSON.stringify(v),
    });
    if (res.status === 401) { clearStoredPassword(); throw new Error("비밀번호가 올바르지 않습니다."); }
    if (!res.ok) throw new Error((await res.json()).error || "수정 실패");
    setData(await res.json());
    setEditing(false);
  }

  async function callDelete(pw: string) {
    const res = await fetch(`/api/quality/${params.nc_no}`, {
      method: "DELETE",
      headers: { "x-quality-password": pw },
    });
    if (res.status === 401) { clearStoredPassword(); throw new Error("비밀번호가 올바르지 않습니다."); }
    if (!res.ok) throw new Error((await res.json()).error || "삭제 실패");
    router.replace("/quality");
  }

  async function tryWithStored(p: Pending): Promise<void> {
    const stored = getStoredPassword();
    if (stored) {
      try {
        if (p.kind === "patch") await callPatch(p.value, stored);
        else await callDelete(stored);
        return;
      } catch (e) {
        if (!(e instanceof Error && e.message.includes("비밀번호"))) { alert((e as Error).message); return; }
      }
    }
    setPending(p); setPwOpen(true);
  }

  function onSubmit(v: NCFormValue) { return tryWithStored({ kind: "patch", value: v }); }
  function onDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    void tryWithStored({ kind: "delete" });
  }

  if (!data) return <Container className="py-8">로딩 중…</Container>;

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/quality" className="text-sm text-slate-500 hover:text-slate-700">← 목록</Link>
          <h1 className="text-2xl font-bold font-mono">{data.nc_no}</h1>
          <SourceBadge source={data.source} />
        </div>
        <div className="flex gap-2">
          {!editing && <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">수정</button>}
          {!editing && <button onClick={onDelete} className="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50">삭제</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300">취소</button>}
        </div>
      </div>

      {editing ? (
        <NCForm initial={data} submitLabel="저장" onSubmit={onSubmit} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm max-w-3xl">
          <Field k="작성일자" v={data.written_date} />
          <Field k="모델명" v={data.model_name} />
          <Field k="LOT 번호" v={data.lot_no} />
          <Field k="처리자" v={data.handler} />
          <Field k="부적합 내용" v={data.defect} />
          <Field k="부적합 원인" v={data.cause} />
          <Field k="조치사항" v={data.action} />
          <Field k="처리결과" v={data.result} />
          <Field k="등록일" v={data.created_at} />
          <Field k="수정일" v={data.updated_at} />
        </div>
      )}

      <PasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onConfirm={async (pw) => {
          if (!pending) return;
          if (pending.kind === "patch") await callPatch(pending.value, pw);
          else await callDelete(pw);
          setStoredPassword(pw);
          setPwOpen(false);
        }}
      />
    </Container>
  );
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex">
      <span className="w-24 text-slate-500 shrink-0">{k}</span>
      <span className="flex-1 text-slate-900 break-all">{v || "-"}</span>
    </div>
  );
}
