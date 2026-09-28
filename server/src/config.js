import crypto from "node:crypto";
const env = process.env;
const bool = (v, d) => (v === undefined || v === "" ? d : ["1", "true", "yes", "sim"].includes(String(v).toLowerCase()));
if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  if (env.NODE_ENV === "production") { console.error("ERRO: defina JWT_SECRET com pelo menos 32 caracteres no arquivo .env (openssl rand -hex 32)."); process.exit(1); }
}
if (env.NODE_ENV === "production" && !env.DATABASE_URL) {
  console.error("ERRO: defina DATABASE_URL (PostgreSQL) no arquivo .env.");
  process.exit(1);
}
export const config = {
  port: Number(env.PORT || 8080),
  dataDir: env.DATA_DIR || "./data",
  databaseUrl: env.DATABASE_URL || "",
  jwtSecret: env.JWT_SECRET && env.JWT_SECRET.length >= 32 ? env.JWT_SECRET : crypto.randomBytes(32).toString("hex"),
  cookieSecure: bool(env.COOKIE_SECURE, false),
  allowRegistration: bool(env.ALLOW_REGISTRATION, true),
  anthropicKey: env.ANTHROPIC_API_KEY || "",
  anthropicBase: (env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, ""),
  model: env.ANTHROPIC_MODEL || "claude-sonnet-5",
  coachDailyLimit: Number(env.COACH_DAILY_LIMIT || 60),
  trustProxy: bool(env.TRUST_PROXY, true),
  webDir: env.WEB_DIR || "../web/dist",
};
