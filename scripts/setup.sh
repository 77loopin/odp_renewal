#!/usr/bin/env bash
# 품질관리 기능 초기 셋업 스크립트
#
# 사용법:
#   ./scripts/setup.sh                              # 기본 셋업
#   ./scripts/setup.sh --seed /path/to/file.xlsx   # 셋업 + 엑셀 시드
#   ./scripts/setup.sh --skip-install              # pnpm install 생략
#
# 동작:
#  1. pnpm install
#  2. better-sqlite3 네이티브 바인딩 빌드 검증/실행
#  3. data/ 디렉토리 생성
#  4. .env.local 생성 (없을 때만, 랜덤 비밀번호 부여)
#  5. (선택) 엑셀 시드 임포트
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_INSTALL=0
SEED_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-install) SKIP_INSTALL=1; shift ;;
    --seed) SEED_FILE="${2:-}"; shift 2 ;;
    --seed=*)       SEED_FILE="${1#--seed=}"; shift ;;
    -h|--help)
      sed -n '2,11p' "$0"; exit 0 ;;
    *) echo "알 수 없는 옵션: $1" >&2; exit 1 ;;
  esac
done

C_BLUE=$'\033[1;36m'
C_GREEN=$'\033[32m'
C_YELLOW=$'\033[33m'
C_DIM=$'\033[2m'
C_RESET=$'\033[0m'

step() { echo; echo "${C_BLUE}▶ $1${C_RESET}"; }
ok()   { echo "  ${C_GREEN}✓${C_RESET} $1"; }
warn() { echo "  ${C_YELLOW}!${C_RESET} $1"; }
info() { echo "  ${C_DIM}· $1${C_RESET}"; }

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "필요한 명령이 없습니다: $1" >&2; exit 1; }
}

require pnpm
require node

# 1) 의존성
step "패키지 설치"
if [[ "$SKIP_INSTALL" -eq 1 ]]; then
  info "--skip-install 지정됨, pnpm install 생략"
elif [[ -d node_modules ]]; then
  info "node_modules 존재 — frozen-lockfile 로 동기화"
  if ! pnpm install --frozen-lockfile; then
    warn "frozen 실패, 일반 install 재시도"
    pnpm install
  fi
  ok "의존성 설치 완료"
else
  pnpm install
  ok "의존성 설치 완료"
fi

# 2) better-sqlite3 네이티브 바인딩
step "better-sqlite3 네이티브 바인딩 검증"
SQLITE_DIR="$(node -e "console.log(require('fs').realpathSync('node_modules/better-sqlite3'))" 2>/dev/null || true)"
if [[ -z "$SQLITE_DIR" ]]; then
  echo "better-sqlite3 패키지를 찾을 수 없습니다. 먼저 의존성을 설치하세요." >&2
  exit 1
fi
BINDING="$SQLITE_DIR/build/Release/better_sqlite3.node"
if [[ -f "$BINDING" ]]; then
  ok "바인딩 존재"
else
  info "바인딩 없음 — install 스크립트 실행"
  ( cd "$SQLITE_DIR" && npm run install --silent )
  if [[ ! -f "$BINDING" ]]; then
    echo "better-sqlite3 빌드 실패. Xcode CommandLineTools / node-gyp 설치 확인이 필요할 수 있습니다." >&2
    exit 1
  fi
  ok "바인딩 빌드 완료"
fi

# 3) data 디렉토리
step "data/ 디렉토리"
mkdir -p data
[[ -f data/.gitkeep ]] || : > data/.gitkeep
ok "준비됨: data/"

# 4) .env.local
step ".env.local 생성"
if [[ -f .env.local ]]; then
  ok ".env.local 이미 존재 — 건너뜀"
else
  GENERATED_PW="$(openssl rand -base64 9 2>/dev/null | tr -d '/+=' | cut -c1-12 || node -e "console.log(require('crypto').randomBytes(6).toString('base64url'))")"
  if [[ -f .env.local.example ]]; then
    sed "s|^QUALITY_ADMIN_PASSWORD=.*|QUALITY_ADMIN_PASSWORD=${GENERATED_PW}|" .env.local.example > .env.local
  else
    echo "QUALITY_ADMIN_PASSWORD=${GENERATED_PW}" > .env.local
  fi
  ok ".env.local 생성 (랜덤 비밀번호: ${GENERATED_PW})"
  warn "운영 시 위 비밀번호를 직접 지정하고 안전하게 관리하세요."
fi

# 5) 시드 (선택)
if [[ -n "$SEED_FILE" ]]; then
  step "엑셀 시드 임포트: $SEED_FILE"
  if [[ ! -f "$SEED_FILE" ]]; then
    warn "파일이 존재하지 않음: $SEED_FILE — 시드 생략"
  else
    pnpm exec tsx scripts/seed-quality.mjs "$SEED_FILE"
    ok "시드 완료"
  fi
else
  info "시드를 같이 실행하려면 --seed <엑셀파일경로> 옵션을 사용하세요."
fi

echo
echo "${C_GREEN}✓ 셋업 완료${C_RESET}"
echo "  다음 단계: pnpm dev → http://localhost:3000/quality"
echo
