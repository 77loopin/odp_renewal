import Link from "next/link";
import Container from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="py-20 text-center">
      <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
      <h2 className="text-xl font-bold text-slate-900 mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-slate-500 mb-8">요청하신 페이지가 존재하지 않습니다.</p>
      <Link
        href="/"
        className="inline-flex items-center px-6 py-3 rounded-xl bg-accent-blue text-white font-medium hover:bg-blue-700 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </Container>
  );
}
