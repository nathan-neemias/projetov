#!/usr/bin/env bash
# Backup do PostgreSQL (mantém 14 dias). Agende: 15 3 * * * cd /caminho/projeto-v && ./backup.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data/backups
F="backup-$(date +%F).sql"
docker compose exec -T db pg_dump -U projetov --no-owner --format=plain projetov > "data/backups/$F"
find data/backups -name 'backup-*.sql' -mtime +14 -delete 2>/dev/null || true
echo "OK: data/backups/$F"
