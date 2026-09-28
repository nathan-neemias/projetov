#!/usr/bin/env bash
# Instala e sobe o Projeto V (Ubuntu/Debian + Docker + PostgreSQL).
#   sudo bash deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

if [ "$(id -u)" -ne 0 ]; then echo "Rode com sudo: sudo bash deploy.sh"; exit 1; fi

if ! command -v docker >/dev/null 2>&1; then
  echo ">> Instalando o Docker..."
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 não encontrado. Instale o plugin docker-compose-plugin."; exit 1; }

if [ ! -f .env ]; then
  echo ">> Criando .env"
  cp .env.example .env
  sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env
  sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 24)/" .env
  chmod 600 .env
fi
if ! grep -Eq '^POSTGRES_PASSWORD=.+' .env; then
  sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 24)/" .env
fi
if grep -Eq '^DOMAIN=.+' .env; then sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=true/' .env; fi

mkdir -p data/backups
echo ">> Construindo e iniciando (a primeira vez leva alguns minutos)..."
docker compose up -d --build

echo ">> Aguardando health..."
OK=0
for i in $(seq 1 60); do
  if docker compose exec -T app node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then OK=1; break; fi
  sleep 3
done
if [ "$OK" -ne 1 ]; then echo "O app não respondeu a tempo. Veja: docker compose logs app"; exit 1; fi
docker compose exec -T app node server/src/cli.js db-status

echo
echo ">> Pronto."
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
DOM=$(grep -E '^DOMAIN=' .env | cut -d= -f2 || true)
if [ -n "${DOM:-}" ]; then echo "   Acesse: https://$DOM (se usou --profile with-caddy)"; else echo "   Acesse: http://${IP:-SEU_IP}:8080"; fi
echo "   1) Crie sua conta na tela inicial (ou: docker compose exec app node server/src/cli.js create-user EMAIL SENHA Nome)."
echo "   2) Coach de IA: preencha ANTHROPIC_API_KEY no .env e: docker compose up -d"
echo "   3) Feche o cadastro: ALLOW_REGISTRATION=false no .env e docker compose up -d"
if ! grep -Eq '^ANTHROPIC_API_KEY=.+' .env; then echo "   (coach de IA ainda desligado: falta a ANTHROPIC_API_KEY)"; fi
