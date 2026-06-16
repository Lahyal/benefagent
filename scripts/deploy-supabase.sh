#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

SUPABASE_BIN="./node_modules/.bin/supabase"
PROJECT_REF="etcgfhmybxkyvxqwowzc"

if [[ ! -x "$SUPABASE_BIN" ]]; then
  echo "Run: npm install"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Create .env from .env.example and add SUPABASE_ACCESS_TOKEN + SUPABASE_DB_PASSWORD + keys."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ -z "${SUPABASE_ANON_KEY:-}" && -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Fetching anon key from Supabase API..."
  SUPABASE_ANON_KEY="$(
    curl -sS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      "https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys" \
      | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);const k=(j||[]).find(x=>x.name==='anon');if(!k){process.exit(1)};process.stdout.write(k.api_key||'');});"
  )" || true
  if [[ -n "${SUPABASE_ANON_KEY:-}" ]]; then
    export SUPABASE_ANON_KEY
  fi
fi

node scripts/generate-supabase-config.js

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN missing — cannot deploy to remote project."
  exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "SUPABASE_DB_PASSWORD missing — cannot run db push."
  exit 1
fi

export SUPABASE_ACCESS_TOKEN

"$SUPABASE_BIN" link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
"$SUPABASE_BIN" db push
"$SUPABASE_BIN" functions deploy analyze-benefits --no-verify-jwt
"$SUPABASE_BIN" functions deploy ai-agent --no-verify-jwt
"$SUPABASE_BIN" functions deploy stripe-webhook --no-verify-jwt

if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  "$SUPABASE_BIN" secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
fi
if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  "$SUPABASE_BIN" secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
fi
if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  "$SUPABASE_BIN" secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
fi

echo "Supabase deploy complete."
