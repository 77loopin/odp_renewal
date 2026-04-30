import type { Source } from "@/lib/quality/types";

const STYLES: Record<Source, string> = {
  excel: "bg-emerald-100 text-emerald-700",
  web: "bg-sky-100 text-sky-700",
};
const LABELS: Record<Source, string> = { excel: "엑셀", web: "수기" };

export default function SourceBadge({ source }: { source: Source }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STYLES[source]}`}>
      {LABELS[source]}
    </span>
  );
}
