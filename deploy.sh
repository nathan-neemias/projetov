#!/usr/bin/env bash
# Instala e sobe o Projeto V neste servidor (Ubuntu/Debian). Rode dentro da pasta do projeto:
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
  chmod 600 .env
fi
# HTTPS: se houver DOMAIN, o cookie precisa ser seguro
if grep -Eq '^DOMAIN=.+' .env; then sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=true/' .env; fi

mkdir -p data backups
echo ">> Construindo e iniciando (a primeira vez leva alguns minutos)..."
docker compose up -d --build

echo ">> Criando e conferindo o banco de dados..."
OK=0
for i in $(seq 1 40); do
  if docker compose exec -T app node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then OK=1; break; fi
  sleep 3
done
if [ "$OK" -ne 1 ]; then echo "O app não respondeu a tempo. Veja: docker compose logs app"; exit 1; fi
docker compose exec -T app node server/src/cli.js db-status

echo
echo ">> Pronto."
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
DOM=$(grep -E '^DOMAIN=' .env | cut -d= -f2)
if [ -n "$DOM" ]; then echo "   Acesse: https://$DOM"; else echo "   Acesse: http://${IP:-SEU_IP}"; fi
echo "   1) Crie sua conta na tela inicial."
echo "   2) Para ativar o coach de IA: nano .env  (preencha ANTHROPIC_API_KEY)  e depois: docker compose up -d"
echo "   3) Depois de criar sua conta, feche o cadastro: ALLOW_REGISTRATION=false no .env e docker compose up -d"
if ! grep -Eq '^ANTHROPIC_API_KEY=.+' .env; then echo "   (coach de IA ainda desligado: falta a ANTHROPIC_API_KEY)"; fi
