---
name: platform-log-analysis
description: Fetch and analyze logs across Vercel and Supabase for this project in one run. Use when asked to analyze logs, inspect latest API calls, debug auth or DB issues, correlate app traffic with Supabase activity, or run combined log triage.
---

# Platform Log Analysis

## Overview

Run one command that fetches:
- Vercel runtime request logs
- Supabase service logs (`api`, `auth`, `postgres`, `storage`, `realtime`, `edge-function`)
- Supabase signup logs

The command writes a single JSON report in `/tmp` with both raw slices and summarized analysis.

## Workflow

1. Ensure prerequisites:
- Vercel CLI is installed and authenticated (`vercel whoami`).
- `.vercel/project.json` is linked to this project.
- `.env.local` has:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (signup fetch)
  - `SUPABASE_ACCESS_TOKEN` or `SUPABASE_MANAGEMENT_API_TOKEN` (service log fetch)
  - note: `SUPABSE_ACCESS_TOKEN` typo is also accepted by script for compatibility, but keep `SUPABASE_ACCESS_TOKEN` as canonical.

2. Run the combined wrapper:
- `bash skills/platform-log-analysis/scripts/fetch.sh`

3. Optional focused run:
- `bash skills/platform-log-analysis/scripts/fetch.sh --vercel-since 24h --vercel-limit 100 --supabase-kind auth --supabase-hours 2 --supabase-limit 100 --signup-days 1 --signup-limit 50`

4. Return:
- output file path
- Vercel: `latest_timestamp`, `total_rows`, `api_rows`, latest requests
- Supabase services: per-service row counts, latest timestamps, and errors
- Supabase signups: count and latest rows
- highlight bullets from `analysis.highlights`

## Troubleshooting

- If Vercel CLI fails in sandbox (cache/auth), rerun with escalated permissions.
- If Supabase service logs fail due missing token, fetch services via Supabase MCP `get_logs` for `api`, `auth`, `postgres`, `storage`, `realtime`, and `edge-function`, then append a merged summary.
- If user asks only one source (only Vercel or only Supabase), limit scope accordingly.
