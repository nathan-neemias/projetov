import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const COOKIE = "pv_session";

export function authRouter({ db, config }) {
  const r = express.Router();
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { erro: "Muitas tentativas. Aguarde alguns minutos." } });
  const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name });
  const setCookie = (res, u) => {
    const token = jwt.sign({ uid: u.id, tv: u.token_version }, config.jwtSecret, { expiresIn: "30d" });
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: config.cookieSecure, maxAge: 30 * 24 * 3600 * 1000, path: "/" });
  };

  r.post("/register", limiter, async (req, res) => {
    const { email, senha, nome } = req.body || {};
    const count = db.prepare("SELECT COUNT(*) c FROM users").get().c;
    if (!config.allowRegistration && count > 0) return res.status(403).json({ erro: "Cadastro fechado neste servidor." });
    const em = String(email || "").trim().toLowerCase();
    if (!EMAIL.test(em)) return res.status(400).json({ erro: "E-mail inválido." });
    if (typeof senha !== "string" || senha.length < 8 || senha.length > 200) return res.status(400).json({ erro: "A senha precisa ter pelo menos 8 caracteres." });
    if (db.prepare("SELECT 1 FROM users WHERE email=?").get(em)) return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    const hash = await bcrypt.hash(senha, 11);
    const info = db.prepare("INSERT INTO users(email,name,hash) VALUES(?,?,?)").run(em, String(nome || "").trim().slice(0, 80), hash);
    const u = db.prepare("SELECT * FROM users WHERE id=?").get(info.lastInsertRowid);
    setCookie(res, u); res.status(201).json({ user: publicUser(u) });
  });

  r.post("/login", limiter, async (req, res) => {
    const em = String(req.body?.email || "").trim().toLowerCase(), senha = String(req.body?.senha || "");
    const u = db.prepare("SELECT * FROM users WHERE email=?").get(em);
    const ok = u ? await bcrypt.compare(senha, u.hash) : await bcrypt.compare(senha, "$2a$11$0000000000000000000000000000000000000000000000000000.");
    if (!u || !ok) return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    setCookie(res, u); res.json({ user: publicUser(u) });
  });

  r.post("/logout", (req, res) => { res.clearCookie(COOKIE, { path: "/" }); res.json({ ok: true }); });

  r.get("/me", (req, res) => { if (!req.user) return res.status(401).json({ erro: "Não autenticado." }); res.json({ user: publicUser(req.user) }); });

  r.post("/password", limiter, async (req, res) => {
    if (!req.user) return res.status(401).json({ erro: "Não autenticado." });
    const { atual, nova } = req.body || {};
    if (!(await bcrypt.compare(String(atual || ""), req.user.hash))) return res.status(403).json({ erro: "Senha atual incorreta." });
    if (typeof nova !== "string" || nova.length < 8 || nova.length > 200) return res.status(400).json({ erro: "A nova senha precisa ter pelo menos 8 caracteres." });
    const hash = await bcrypt.hash(nova, 11);
    db.prepare("UPDATE users SET hash=?, token_version=token_version+1 WHERE id=?").run(hash, req.user.id);
    const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
    setCookie(res, u); res.json({ ok: true });
  });

  return r;
}

export function sessionMiddleware({ db, config }) {
  return (req, _res, next) => {
    const t = req.cookies && req.cookies[COOKIE];
    if (t) {
      try { const p = jwt.verify(t, config.jwtSecret); const u = db.prepare("SELECT * FROM users WHERE id=?").get(p.uid); if (u && u.token_version === p.tv) req.user = u; } catch { /* sessão inválida */ }
    }
    next();
  };
}
export const requireUser = (req, res, next) => (req.user ? next() : res.status(401).json({ erro: "Faça login." }));

/** Proteção CSRF: em métodos que alteram dados, exige Origin igual ao host quando o navegador envia Origin. */
export function sameOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const o = req.get("origin");
  if (o) { try { if (new URL(o).host !== req.get("host")) return res.status(403).json({ erro: "Origem não permitida." }); } catch { return res.status(403).json({ erro: "Origem inválida." }); } }
  next();
}
