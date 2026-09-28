import express from "express";
import crypto from "node:crypto";
import { requireUser } from "./auth.js";
import { PERSONAL_RULES, NUTRI_RULES } from "../../shared/prompts.js";
import { TOOL_DEFS, runTool } from "../../shared/tools.js";

const MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const today = () => new Date().toISOString().slice(0, 10);

function friendly(status) {
  if (status === 401 || status === 403) return { code: "api_key", message: "A chave da API da Anthropic no servidor é inválida ou não tem permissão." };
  if (status === 429) return { code: "rate_limited", message: "O limite de uso da API foi atingido. Tente de novo em alguns minutos." };
  if (status === 529 || status === 503) return { code: "overloaded", message: "O serviço de IA está ocupado. Tente de novo em instantes." };
  if (status === 400) return { code: "bad_request", message: "A conversa ficou inválida ou grande demais. Toque em Nova conversa." };
  return { code: "upstream", message: "O coach não conseguiu responder agora." };
}

async function streamOnce({ config, system, messages, signal }, send) {
  const resp = await fetch(`${config.anthropicBase}/v1/messages`, {
    method: "POST", signal,
    headers: { "content-type": "application/json", "x-api-key": config.anthropicKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: config.model, max_tokens: 2500, system, messages, tools: TOOL_DEFS, stream: true }),
  });
  if (!resp.ok) { const e = new Error("upstream " + resp.status); e.status = resp.status; throw e; }
  const blocks = []; let stop = null;
  const handle = (raw) => {
    const line = raw.split("\n").find((l) => l.startsWith("data:")); if (!line) return;
    let d; try { d = JSON.parse(line.slice(5).trim()); } catch { return; }
    if (d.type === "content_block_start") blocks[d.index] = d.content_block.type === "tool_use" ? { type: "tool_use", id: d.content_block.id, name: d.content_block.name, json: "", input: {} } : { type: "text", text: "" };
    else if (d.type === "content_block_delta") {
      const b = blocks[d.index]; if (!b) return;
      if (d.delta.type === "text_delta") { b.text += d.delta.text; send({ type: "text", delta: d.delta.text }); }
      else if (d.delta.type === "input_json_delta") b.json += d.delta.partial_json;
    } else if (d.type === "content_block_stop") { const b = blocks[d.index]; if (b && b.type === "tool_use") { try { b.input = b.json ? JSON.parse(b.json) : {}; } catch { b.input = {}; } } }
    else if (d.type === "message_delta") stop = d.delta && d.delta.stop_reason;
    else if (d.type === "error") { const e = new Error("upstream stream error"); e.status = d.error?.type === "overloaded_error" ? 529 : 500; throw e; }
  };
  const reader = resp.body.getReader(), dec = new TextDecoder(); let buf = "";
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf("\n\n")) >= 0) { const raw = buf.slice(0, i); buf = buf.slice(i + 2); handle(raw); }
  }
  if (buf.trim()) handle(buf);
  const content = blocks.filter(Boolean).map((b) => (b.type === "tool_use" ? { type: "tool_use", id: b.id, name: b.name, input: b.input } : { type: "text", text: b.text })).filter((b) => b.type !== "text" || b.text);
  return { content, stop };
}

export function coachRouter({ db, config }) {
  const r = express.Router();
  r.use(requireUser);
  const used = async (uid) => {
    const row = await db.one("SELECT coach_calls AS c FROM usage WHERE user_id=$1 AND day=$2", [uid, today()]);
    return row ? Number(row.c) : 0;
  };

  r.get("/coach/status", async (req, res) => {
    res.json({ enabled: !!config.anthropicKey, images: true, model: config.model, limite: config.coachDailyLimit, usados: await used(req.user.id) });
  });

  r.post("/coach", express.json({ limit: "12mb" }), async (req, res) => {
    if (!config.anthropicKey) return res.status(503).json({ erro: "O coach não está configurado neste servidor (falta ANTHROPIC_API_KEY)." });
    const { mode, messages, context, plan, images } = req.body || {};
    if (!["personal", "nutri"].includes(mode)) return res.status(400).json({ erro: "Modo inválido." });
    if (!Array.isArray(messages) || !messages.length || messages.length > 30) return res.status(400).json({ erro: "Mensagens inválidas." });
    let total = 0; const msgs = [];
    for (const m of messages) { if (!m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || !m.content.trim() || m.content.length > 8000) return res.status(400).json({ erro: "Mensagem inválida." }); total += m.content.length; msgs.push({ role: m.role, content: m.content }); }
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== "user" || total > 60000) return res.status(400).json({ erro: "A conversa deve terminar com uma mensagem do usuário e ter no máximo 60 mil caracteres." });
    if (context != null && (typeof context !== "string" || context.length > 30000)) return res.status(400).json({ erro: "Contexto inválido." });
    const imgs = Array.isArray(images) ? images.slice(0, 2) : [];
    for (const im of imgs) if (!im || !MEDIA.has(im.media_type) || typeof im.data !== "string" || im.data.length > 7_000_000) return res.status(400).json({ erro: "Imagem inválida ou grande demais." });
    if ((await used(req.user.id)) >= config.coachDailyLimit) return res.status(429).json({ erro: `Limite diário de ${config.coachDailyLimit} perguntas ao coach atingido. Volte amanhã.` });
    await db.query(
      `INSERT INTO usage(user_id,day,coach_calls) VALUES($1,$2,1)
       ON CONFLICT(user_id,day) DO UPDATE SET coach_calls=usage.coach_calls+1`,
      [req.user.id, today()],
    );

    if (imgs.length) { const last = msgs[msgs.length - 1]; last.content = [...imgs.map((im) => ({ type: "image", source: { type: "base64", media_type: im.media_type, data: im.data } })), { type: "text", text: last.content }]; }
    const system = `${mode === "personal" ? PERSONAL_RULES : NUTRI_RULES}\n\n# DADOS DO ALUNO (atualizados agora)\n${context || "sem dados"}`;
    const ac = new AbortController(); res.on("close", () => ac.abort());
    res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    const send = (o) => { if (!res.writableEnded) res.write("data: " + JSON.stringify(o) + "\n\n"); };
    try {
      let truncated = false;
      for (let round = 0; round < 5; round++) {
        const { content, stop } = await streamOnce({ config, system, messages: msgs, signal: ac.signal }, send);
        if (stop !== "tool_use") { truncated = stop === "max_tokens"; break; }
        msgs.push({ role: "assistant", content });
        const results = [];
        for (const b of content) if (b.type === "tool_use") {
          try { const out = runTool(b.name, b.input, plan, (p) => send({ type: "proposal", proposal: { ...p, id: crypto.randomBytes(6).toString("hex") } })); results.push({ type: "tool_result", tool_use_id: b.id, content: typeof out === "string" ? out : JSON.stringify(out) }); }
          catch (e) { results.push({ type: "tool_result", tool_use_id: b.id, content: "Erro: " + e.message, is_error: true }); }
        }
        msgs.push({ role: "user", content: results });
      }
      send({ type: "done", truncated });
    } catch (e) {
      if (!ac.signal.aborted) send({ type: "error", ...friendly(e.status) });
    } finally { res.end(); }
  });
  return r;
}
