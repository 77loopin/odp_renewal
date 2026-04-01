"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <Container className="py-4">
      <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "검색" }]} />

      <h1 className="text-3xl font-bold text-slate-900 mb-6">제품 검색</h1>
      <SearchBar autoFocus className="mb-8 max-w-2xl" />
      <SearchResults query={query} />
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
