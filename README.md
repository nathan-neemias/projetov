# Projeto V

Sistema completo de treino, dieta e evolução com coach de IA.
**React (Vite) no navegador + Node.js (Express) + SQLite no servidor.** Funciona no celular como app (PWA).

## O que tem

- **Contas e login próprios** (senha com bcrypt, sessão em cookie httpOnly, troca de senha, cadastro que pode ser fechado).
- **Treino guiado** com mapa de músculos, ilustração da máquina, cronômetro de descanso, progressão de carga automática, deload e RIR.
- **Personalizar treino:** gerar, montar ou colar o treino que você já tem, com sugestões de volume.
- **Dieta inteligente** montada só com os alimentos do seu **Mercado**: medidas caseiras, cru x cozido, modo de preparo, pratos, semana e lista de compras.
- **Evolução:** peso (média de 7 dias), cintura, cargas por exercício, fotos de antes e depois.
- **Insights automáticos** (regras): peso parado, perda rápida demais, estagnação por exercício, fadiga, treinos em atraso, proteína e água abaixo da meta.
- **Coach de IA** (Personal e Nutricionista) no servidor: conhece seus dados, faz check-in semanal, analisa foto de prato, rótulo, máquina e físico, e **propõe mudanças com botão "Aplicar"** (nada muda sozinho).
- Exportar e importar seus dados, backup do banco, limite diário de perguntas ao coach.

## Instalar no seu servidor (Ubuntu/Debian, com Docker)

> **Segurança primeiro.** Nunca compartilhe a senha do servidor em conversas ou e-mails. Se já compartilhou, troque agora (`passwd`) e prefira entrar por **chave SSH** com o login por senha desativado.

1. **No seu computador**, envie a pasta (ajuste usuário e IP):
   ```bash
   scp projeto-v.zip SEU_USUARIO@IP_DO_SERVIDOR:~
   ```
2. **No servidor:**
   ```bash
   sudo apt-get update && sudo apt-get install -y unzip
   unzip projeto-v.zip && cd projeto-v
   sudo bash deploy.sh
   ```
   O script instala o Docker (se faltar), cria o `.env` com um segredo aleatório e sobe tudo.
3. **Abra `http://IP_DO_SERVIDOR`** e crie sua conta.
4. **Ative o coach de IA:** edite o `.env` (`nano .env`), preencha `ANTHROPIC_API_KEY` (chave em console.anthropic.com) e rode `sudo docker compose up -d`.
5. **Feche o cadastro** depois de criar sua conta: no `.env`, `ALLOW_REGISTRATION=false` e `sudo docker compose up -d`.

### HTTPS (recomendado)
Aponte um domínio para o IP do servidor (pode ser um gratuito, como DuckDNS). No `.env` coloque `DOMAIN=treino.seudominio.com.br` e `COOKIE_SECURE=true`, e rode `sudo docker compose up -d`. O certificado é emitido e renovado sozinho. Libere as portas 80 e 443.

Sem domínio, o sistema funciona por HTTP no IP, mas o login trafega sem criptografia. Use assim só em rede confiável ou para testar.

### Firewall básico
```bash
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

## Subir e atualizar pelo Git (recomendado)

A chave SSH é criada **no servidor** e a parte privada nunca sai de lá. O repositório deve ser **privado** (são dados de saúde e código seu). O `.env`, o banco e os backups nunca vão para o Git (estão no `.gitignore`).

**1. No seu computador** (com um repositório privado vazio já criado no GitHub):
```bash
unzip projeto-v-repo.zip && cd projeto-v
git remote add origin git@github.com:SEU_USUARIO/projeto-v.git
git push -u origin main
```

**2. No servidor**, gere a chave (só uma vez):
```bash
ssh-keygen -t ed25519 -C "deploy-projeto-v" -f ~/.ssh/projeto_v_deploy -N ""
cat ~/.ssh/projeto_v_deploy.pub
```
Copie a linha que aparece e cadastre no GitHub: repositório > **Settings > Deploy keys > Add deploy key**, cole, **deixe "Allow write access" desmarcado** (a chave só poderá ler).

**3. No servidor**, diga ao SSH para usar essa chave e clone:
```bash
cat >> ~/.ssh/config <<'CFG'
Host github-projeto-v
  HostName github.com
  User git
  IdentityFile ~/.ssh/projeto_v_deploy
  IdentitiesOnly yes
CFG
chmod 600 ~/.ssh/config
git clone git@github-projeto-v:SEU_USUARIO/projeto-v.git
cd projeto-v && sudo bash deploy.sh
```

**4. Sempre que você mudar o código:** `git push` no seu computador e, no servidor:
```bash
cd projeto-v && sudo bash update.sh
```
O `update.sh` faz `git pull`, tira um backup do banco, reconstrói e mostra o estado do banco.

## Banco de dados

O banco é um **SQLite no próprio servidor**, criado sozinho na primeira subida em `./data/projeto-v.sqlite` (volume do Docker; sobrevive a reinícios e atualizações). Você não instala nem configura nada.

- **Esquema versionado:** a cada subida o app aplica só as migrações que faltam (tabela `schema_migrations`). Bancos criados por versões antigas são adotados sem perder dados.
- **Conferir:** `sudo docker compose exec app node server/src/cli.js db-status` mostra tamanho, versão do esquema, integridade e contagem de tabelas. O `deploy.sh` roda isso no fim.
- **Backup:** `sudo ./backup.sh` (consistente, com o app no ar). **Restaurar:** `sudo ./restore.sh data/backups/backup-AAAA-MM-DD.sqlite`.
- **Quando pensar em PostgreSQL:** SQLite atende bem uma pessoa ou algumas centenas de usuários em um servidor só. Se você for ter milhares de usuários ativos ou vários servidores, o próximo passo é migrar para PostgreSQL (o acesso ao banco está concentrado em `server/src/`).

## Operação

| Tarefa | Comando (dentro da pasta) |
|---|---|
| Ver logs | `sudo docker compose logs -f app` |
| Reiniciar | `sudo docker compose restart` |
| Atualizar depois de mudar o código | `sudo docker compose up -d --build` |
| Backup agora | `sudo ./backup.sh` (salva em `data/backups`) |
| Restaurar backup | `sudo ./restore.sh data/backups/backup-AAAA-MM-DD.sqlite` |
| Conferir o banco | `sudo docker compose exec app node server/src/cli.js db-status` |
| Backup diário | `sudo crontab -e` e adicione `15 3 * * * cd /CAMINHO/projeto-v && ./backup.sh` |
| Listar usuários | `sudo docker compose exec app node server/src/cli.js users` |
| Redefinir senha | `sudo docker compose exec app node server/src/cli.js reset-password EMAIL NOVA_SENHA` |
| Apagar um usuário | `sudo docker compose exec app node server/src/cli.js delete-user EMAIL` |

Os dados ficam em `./data/projeto-v.sqlite`. Guarde cópias fora do servidor.

## Sem Docker
Requer Node 22.
```bash
npm run install:all && npm run build
cd server && JWT_SECRET=$(openssl rand -hex 32) NODE_ENV=production WEB_DIR=../web/dist DATA_DIR=./data ANTHROPIC_API_KEY=... node src/index.js
```
Use `pm2` ou `systemd` para manter no ar e um proxy (nginx ou Caddy) na frente para HTTPS.

## Desenvolvimento
```bash
npm run install:all
npm run dev:server     # API em http://localhost:8080
npm run dev:web        # app em http://localhost:5173 (proxy para a API)
npm test               # testes da API (login, dados, isolamento, coach com IA simulada)
```

## Estrutura
```
server/   API Express: auth, dados (documentos JSON por usuário), coach (streaming SSE + ferramentas)
web/      React + Vite (PWA)
shared/   biblioteca de exercícios, regras dos coaches e ferramentas de proposta (usados por web e server)
```
API principal: `POST /api/auth/{register,login,logout,password}`, `GET /api/auth/me`, `GET /api/data`, `PUT|DELETE /api/doc/:id`, `GET /api/export`, `POST /api/import`, `GET /api/coach/status`, `POST /api/coach` (SSE).

## Privacidade e limites
- Os dados de saúde ficam no seu servidor. Ao usar o coach, o **contexto da conversa (treino, medidas, cardápio) é enviado à API da Anthropic** para gerar a resposta. Fotos enviadas ao coach também.
- A IA é **orientação educativa**, não substitui médico, nutricionista ou educador físico. Ela recusa metas abaixo de 1.500 kcal e não recomenda anabolizantes ou dietas extremas.
- Se o sistema for usado por outras pessoas, informe o uso dos dados (LGPD) e mantenha o servidor atualizado.
