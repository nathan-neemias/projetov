#!/usr/bin/env bash
# Restaura um dump SQL. Uso: sudo ./restore.sh data/backups/backup-2026-10-12.sql
set -euo pipefail
cd "$(dirname "$0")"
[ -f "${1:-}" ] || { echo "Informe um dump existente. Ex.: ./restore.sh data/backups/backup-2026-10-12.sql"; exit 1; }
echo ">> Parando o app..."; docker compose stop app
echo ">> Restaurando..."
docker compose exec -T db psql -U projetov -d projetov -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T db psql -U projetov -d projetov < "$1"
echo ">> Subindo de novo..."
docker compose up -d app
sleep 5
docker compose exec -T app node server/src/cli.js db-status
echo "Restaurado."
