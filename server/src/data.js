import express from "express";
import { requireUser } from "./auth.js";

const ID = /^(profile|d_\d{4}-\d{2}-\d{2}|ph_\d{4}-\d{2}-\d{2})$/;
const LIMIT = (id) => (id === "profile" ? 400_000 : id.startsWith("ph_") ? 900_000 : 200_000);

export function dataRouter({ db }) {
  const r = express.Router();
  r.use(requireUser);
  const parse = express.json({ limit: "1mb" });

  r.get("/data", (req, res) => {
    const rows = db.prepare("SELECT id, data FROM docs WHERE user_id=?").all(req.user.id);
    const docs = {}; for (const x of rows) { try { docs[x.id] = JSON.parse(x.data); } catch { /* ignora doc corrompido */ } }
    res.json({ docs });
  });

  r.put("/doc/:id", parse, (req, res) => {
    const id = req.params.id;
    if (!ID.test(id)) return res.status(400).json({ erro: "Documento inválido." });
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return res.status(400).json({ erro: "Corpo inválido." });
    const s = JSON.stringify(req.body);
    if (s.length > LIMIT(id)) return res.status(413).json({ erro: "Documento grande demais." });
    db.prepare("INSERT INTO docs(user_id,id,data,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP").run(req.user.id, id, s);
    res.json({ ok: true });
  });

  r.delete("/doc/:id", (req, res) => {
    if (!ID.test(req.params.id)) return res.status(400).json({ erro: "Documento inválido." });
    db.prepare("DELETE FROM docs WHERE user_id=? AND id=?").run(req.user.id, req.params.id); res.json({ ok: true });
  });

  r.delete("/data", (req, res) => { db.prepare("DELETE FROM docs WHERE user_id=?").run(req.user.id); res.json({ ok: true }); });

  r.get("/export", (req, res) => {
    const rows = db.prepare("SELECT id, data FROM docs WHERE user_id=?").all(req.user.id);
    const docs = {}; for (const x of rows) { try { docs[x.id] = JSON.parse(x.data); } catch { /* */ } }
    res.setHeader("Content-Disposition", `attachment; filename="projeto-v-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({ exportadoEm: new Date().toISOString(), usuario: { email: req.user.email, nome: req.user.name }, docs });
  });

  r.post("/import", express.json({ limit: "20mb" }), (req, res) => {
    const docs = req.body && req.body.docs; if (!docs || typeof docs !== "object") return res.status(400).json({ erro: "Arquivo inválido." });
    const put = db.prepare("INSERT INTO docs(user_id,id,data,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP");
    let n = 0;
    db.transaction(() => { for (const [id, v] of Object.entries(docs)) { if (!ID.test(id) || !v || typeof v !== "object") continue; const s = JSON.stringify(v); if (s.length > LIMIT(id)) continue; put.run(req.user.id, id, s); n++; } })();
    res.json({ ok: true, importados: n });
  });
  return r;
}
