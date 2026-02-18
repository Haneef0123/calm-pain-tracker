#!/usr/bin/env bash
set -euo pipefail

PROJECT="calm-pain-tracker"
VERCEL_SINCE="30d"
VERCEL_LIMIT="200"
SUPABASE_KIND="all"
SUPABASE_HOURS="6"
SUPABASE_LIMIT="100"
SIGNUP_DAYS="7"
SIGNUP_LIMIT="100"
OUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT="$2"
      shift 2
      ;;
    --vercel-since)
      VERCEL_SINCE="$2"
      shift 2
      ;;
    --vercel-limit)
      VERCEL_LIMIT="$2"
      shift 2
      ;;
    --supabase-kind)
      SUPABASE_KIND="$2"
      shift 2
      ;;
    --supabase-hours)
      SUPABASE_HOURS="$2"
      shift 2
      ;;
    --supabase-limit)
      SUPABASE_LIMIT="$2"
      shift 2
      ;;
    --signup-days)
      SIGNUP_DAYS="$2"
      shift 2
      ;;
    --signup-limit)
      SIGNUP_LIMIT="$2"
      shift 2
      ;;
    --out)
      OUT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage:"
      echo "  bash skills/platform-log-analysis/scripts/fetch.sh [--project calm-pain-tracker] [--vercel-since 30d] [--vercel-limit 200] [--supabase-kind all] [--supabase-hours 6] [--supabase-limit 100] [--signup-days 7] [--signup-limit 100] [--out /tmp/file.json]"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
FETCH_SCRIPT="$ROOT_DIR/scripts/fetch-platform-logs.mjs"

if [[ ! -f "$FETCH_SCRIPT" ]]; then
  echo "Missing script: $FETCH_SCRIPT" >&2
  exit 1
fi

if [[ -z "$OUT" ]]; then
  TS="$(date -u +%Y%m%dT%H%M%SZ)"
  OUT="/tmp/calm-pain-platform-log-analysis-${TS}.json"
fi

node "$FETCH_SCRIPT" \
  --project "$PROJECT" \
  --vercel-since "$VERCEL_SINCE" \
  --vercel-limit "$VERCEL_LIMIT" \
  --supabase-kind "$SUPABASE_KIND" \
  --supabase-hours "$SUPABASE_HOURS" \
  --supabase-limit "$SUPABASE_LIMIT" \
  --signup-days "$SIGNUP_DAYS" \
  --signup-limit "$SIGNUP_LIMIT" \
  --out "$OUT" >/dev/null

node -e '
const fs = require("fs");
const p = process.argv[1];
const j = JSON.parse(fs.readFileSync(p, "utf8"));
console.log(`output=${p}`);
console.log(`fetched_at=${j.fetched_at}`);
console.log(`vercel_total_rows=${j?.vercel?.total_rows ?? 0}`);
console.log(`vercel_api_rows=${j?.vercel?.api_rows ?? 0}`);
console.log(`supabase_services_ok=${j?.supabase?.services?.command_ok ? "yes" : "no"}`);
console.log(`supabase_signup_count=${j?.supabase?.signups?.signup_users_returned ?? 0}`);
for (const h of (j?.analysis?.highlights || [])) {
  console.log(`highlight=${h}`);
}
' "$OUT"
