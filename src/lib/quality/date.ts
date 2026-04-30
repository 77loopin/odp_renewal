const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

export function normalizeDate(input: unknown): string | null {
  if (input === null || input === undefined) return null;

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : toIso(input);
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    const ms = EXCEL_EPOCH + Math.round(input) * 86400000;
    return toIso(new Date(ms));
  }

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return null;
    const m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
    if (m) {
      const [, y, mo, d] = m;
      const mm = mo.padStart(2, "0");
      const dd = d.padStart(2, "0");
      const date = new Date(`${y}-${mm}-${dd}T00:00:00Z`);
      return isNaN(date.getTime()) ? null : `${y}-${mm}-${dd}`;
    }
    return null;
  }

  return null;
}

function toIso(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
