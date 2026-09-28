import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import { config as base } from "./config.js";
import { openDb } from "./db.js";
import { authRouter, sessionMiddleware, sameOrigin } from "./auth.js";
import { dataRouter } from "./data.js";
import { coachRouter } from "./coach.js";

export async function createApp(over = {}) {
  const config = { ...base, ...over };
  const db = await openDb(config);
  const app = express();
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", "data:", "blob:"], fontSrc: ["'self'", "data:"], connectSrc: ["'self'"], workerSrc: ["'self'"], manifestSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], upgradeInsecureRequests: config.cookieSecure ? [] : null } },
    strictTransportSecurity: config.cookieSecure, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: "same-origin" },
  }));
  app.use(compression({ filter: (req, res) => !String(res.getHeader("Content-Type") || "").includes("event-stream") && compression.filter(req, res) }));
  app.use(cookieParser());
  app.use(sessionMiddleware({ db, config }));
  app.use("/api", sameOrigin);
  app.get("/api/health", (_q, res) => res.json({ ok: true }));
  app.use("/api/auth", express.json({ limit: "50kb" }), authRouter({ db, config }));
  app.use("/api", dataRouter({ db }));
  app.use("/api", coachRouter({ db, config }));
  app.use("/api", (_q, res) => res.status(404).json({ erro: "Rota não encontrada." }));

  const web = path.resolve(config.webDir);
  if (fs.existsSync(path.join(web, "index.html"))) {
    app.use(express.static(web, { index: false, maxAge: 0, setHeaders: (res, f) => { if (f.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); else res.setHeader("Cache-Control", "no-cache"); } }));
    app.get("*", (_q, res) => { res.setHeader("Cache-Control", "no-cache"); res.sendFile(path.join(web, "index.html")); });
  }
  app.use((err, _q, res, _n) => { console.error(err); if (res.headersSent) return res.end(); res.status(err.status || 500).json({ erro: err.status === 413 ? "Conteúdo grande demais." : err.type === "entity.parse.failed" ? "JSON inválido." : "Erro interno." }); });
  return { app, db, config };
}
