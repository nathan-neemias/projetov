#!/usr/bin/env bash
# Backup diário do banco (mantém 14 dias). Agende: crontab -e  ->  15 3 * * * cd /caminho/projeto-v && ./backup.sh
set -euo pipefail
cd "$(dirname "$0")"
F="backup-$(date +%F).sqlite"
docker compose exec -T app node server/src/backup.js "/data/backups/$F"
find data/backups -name 'backup-*.sqlite' -mtime +14 -delete 2>/dev/null || true
echo "OK: data/backups/$F"
