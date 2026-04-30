"use client";
import { useEffect, useState } from "react";
import type { CatalogMeta } from "./ModelLink";

/**
 * 주어진 모델명 목록을 받아 /api/quality/catalog 로 일괄 조회한 매핑을 반환.
 * - 새 모델명이 들어오면 자동 재조회
 * - 결과는 컴포넌트 unmount 시 GC
 */
export function useCatalogLookup(models: string[]): Record<string, CatalogMeta> {
  const [map, setMap] = useState<Record<string, CatalogMeta>>({});
  const key = Array.from(new Set(models)).filter(Boolean).sort().join(",");
  useEffect(() => {
    if (!key) { setMap({}); return; }
    let alive = true;
    fetch(`/api/quality/catalog?parts=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setMap(d as Record<string, CatalogMeta>); })
      .catch(() => { /* ignore */ });
    return () => { alive = false; };
  }, [key]);
  return map;
}
