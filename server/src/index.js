import { createApp } from "./app.js";
const { app, db, config } = await createApp();
const server = app.listen(config.port, () => {
  console.log(`Projeto V rodando na porta ${config.port} (${db.kind})`);
  if (!config.anthropicKey) console.warn("Aviso: ANTHROPIC_API_KEY não definida. O coach de IA ficará desligado.");
  if (!config.cookieSecure) console.warn("Aviso: COOKIE_SECURE=false. Use HTTPS e COOKIE_SECURE=true em produção.");
});
const stop = () => { server.close(async () => { await db.close(); process.exit(0); }); setTimeout(() => process.exit(0), 5000).unref(); };
process.on("SIGTERM", stop); process.on("SIGINT", stop);
