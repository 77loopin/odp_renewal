import { timingSafeEqual } from "node:crypto";

export class PasswordError extends Error {
  constructor(public status: 401 | 503, message: string) {
    super(message);
  }
}

export function verifyPassword(headerValue: string | null | undefined): void {
  const expected = process.env.QUALITY_ADMIN_PASSWORD;
  if (!expected) {
    throw new PasswordError(
      503,
      "QUALITY_ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. .env.local에 추가해 주세요.",
    );
  }
  if (!headerValue) {
    throw new PasswordError(401, "비밀번호가 필요합니다.");
  }
  const a = Buffer.from(headerValue);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new PasswordError(401, "비밀번호가 올바르지 않습니다.");
  }
}
