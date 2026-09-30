#!/bin/sh
set -eu
if [ -z "${DATABASE_URL:-}" ] || [ -z "${SESSION_SECRET:-}" ]; then
  echo "DATABASE_URL e SESSION_SECRET são obrigatórios." >&2
  exit 1
fi
cd /repo/apps/api
pnpm exec prisma migrate deploy
cd /repo
exec node apps/api/dist/main.js
