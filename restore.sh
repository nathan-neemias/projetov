#!/usr/bin/env bash
# Restaura um backup do banco.  Uso: sudo ./restore.sh data/backups/backup-2026-10-12.sqlite
set -euo pipefail
cd "$(dirname "$0")"
[ -f "${1:-}" ] || { echo "Informe um arquivo de backup existente. Ex.: ./restore.sh data/backups/backup-2026-10-12.sqlite"; exit 1; }
echo ">> Parando o app..."; docker compose stop app
cp -f data/projeto-v.sqlite "data/projeto-v.antes-do-restore.sqlite" 2>/dev/null || true
rm -f data/projeto-v.sqlite-wal data/projeto-v.sqlite-shm
cp -f "$1" data/projeto-v.sqlite
echo ">> Subindo de novo e conferindo o banco..."
docker compose up -d app
sleep 5
docker compose exec -T app node server/src/cli.js db-status
echo "Restaurado. A cópia anterior ficou em data/projeto-v.antes-do-restore.sqlite"
