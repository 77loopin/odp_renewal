import { describe, it, expect } from "vitest";
import { normalizeDate } from "@/lib/quality/date";

describe("normalizeDate", () => {
  it("dot-separated", () => {
    expect(normalizeDate("2025.01.02")).toBe("2025-01-02");
    expect(normalizeDate("2025.1.2")).toBe("2025-01-02");
  });
  it("slash-separated", () => {
    expect(normalizeDate("2025/01/02")).toBe("2025-01-02");
    expect(normalizeDate("2025/1/2")).toBe("2025-01-02");
  });
  it("dash-separated (already ISO)", () => {
    expect(normalizeDate("2025-01-02")).toBe("2025-01-02");
  });
  it("Date object", () => {
    expect(normalizeDate(new Date("2025-01-02T09:00:00Z"))).toBe("2025-01-02");
  });
  it("Excel serial number", () => {
    expect(normalizeDate(45659)).toBe("2025-01-02");
  });
  it("trims whitespace", () => {
    expect(normalizeDate("  2025.01.02  ")).toBe("2025-01-02");
  });
  it("returns null for invalid", () => {
    expect(normalizeDate("not a date")).toBeNull();
    expect(normalizeDate("")).toBeNull();
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate(undefined)).toBeNull();
  });
});
