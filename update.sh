#!/usr/bin/env bash
# Atualiza o sistema a partir do Git e reinicia.  Uso (na pasta do projeto):  sudo bash update.sh
set -euo pipefail
cd "$(dirname "$0")"
[ "$(id -u)" -eq 0 ] || { echo "Rode com sudo: sudo bash update.sh"; exit 1; }
[ -d .git ] || { echo "Esta pasta não é um clone do Git. Faça: git clone ..."; exit 1; }

# o git pull deve rodar com o usuário dono da pasta (é ele que tem a chave SSH)
OWNER=$(stat -c '%U' .)
echo ">> Baixando novidades do Git (usuário $OWNER)..."
if [ "$OWNER" = "root" ]; then git pull --ff-only; else sudo -u "$OWNER" git pull --ff-only; fi

echo ">> Backup do banco antes de atualizar..."
if docker compose ps --status running app >/dev/null 2>&1; then bash backup.sh || echo "(backup não foi possível; seguindo)"; fi

echo ">> Reconstruindo e reiniciando..."
docker compose up -d --build

for i in $(seq 1 40); do
  docker compose exec -T app node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1 && break
  sleep 3
done
docker compose exec -T app node server/src/cli.js db-status
echo ">> Atualizado: $(git log -1 --format='%h %s')"
