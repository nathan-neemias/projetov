import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../src/app.js";

let srv, base, mock, mockBase, calls = [], jar = "", db;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pv-"));
const sse = (events) => events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");

before(async () => {
  mock = http.createServer((req, res) => {
    let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
      const j = JSON.parse(body); calls.push(j);
      res.writeHead(200, { "content-type": "text/event-stream" });
      const hasResult = j.messages.some((m) => Array.isArray(m.content) && m.content.some((b) => b.type === "tool_result"));
      if (!hasResult && /meta/i.test(JSON.stringify(j.messages.at(-1)))) {
        res.end(sse([{ type: "message_start" }, { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }, { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Vou propor " } }, { type: "content_block_stop", index: 0 },
          { type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "tu_1", name: "propor_metas_dieta" } }, { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: "{\"kcal\":2300," } }, { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: "\"motivo\":\"peso parado\"}" } }, { type: "content_block_stop", index: 1 },
          { type: "message_delta", delta: { stop_reason: "tool_use" } }, { type: "message_stop" }]));
      } else {
        res.end(sse([{ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }, { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Feito. " } }, { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Ok." } }, { type: "content_block_stop", index: 0 }, { type: "message_delta", delta: { stop_reason: "end_turn" } }, { type: "message_stop" }]));
      }
    });
  });
  await new Promise((r) => mock.listen(0, r)); mockBase = `http://127.0.0.1:${mock.address().port}`;
  const created = await createApp({ dataDir: tmp, webDir: "/nao-existe", anthropicKey: "k-teste", anthropicBase: mockBase, jwtSecret: "x".repeat(40), coachDailyLimit: 3, databaseUrl: "" });
  db = created.db;
  srv = http.createServer(created.app); await new Promise((r) => srv.listen(0, r)); base = `http://127.0.0.1:${srv.address().port}`;
});
after(async () => { srv.close(); mock.close(); if (db) await db.close(); });

const req = async (method, url, body, extra = {}) => {
  const r = await fetch(base + url, { method, headers: { "content-type": "application/json", cookie: jar, ...extra }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get("set-cookie"); if (sc) jar = sc.split(";")[0];
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* sse */ } return { s: r.status, j, t };
};

test("saúde e rotas protegidas", async () => {
  assert.equal((await req("GET", "/api/health")).s, 200);
  assert.equal((await req("GET", "/api/data")).s, 401);
  assert.equal((await req("GET", "/api/auth/me")).s, 401);
});
test("cadastro, login e validações", async () => {
  assert.equal((await req("POST", "/api/auth/register", { email: "ruim", senha: "12345678" })).s, 400);
  assert.equal((await req("POST", "/api/auth/register", { email: "a@b.com", senha: "curta" })).s, 400);
  const ok = await req("POST", "/api/auth/register", { email: "Joao@Exemplo.com", senha: "senha-forte-1", nome: "João" });
  assert.equal(ok.s, 201); assert.equal(ok.j.user.email, "joao@exemplo.com");
  assert.equal((await req("POST", "/api/auth/register", { email: "joao@exemplo.com", senha: "senha-forte-1" })).s, 409);
  assert.equal((await req("GET", "/api/auth/me")).j.user.name, "João");
  jar = ""; assert.equal((await req("POST", "/api/auth/login", { email: "joao@exemplo.com", senha: "errada" })).s, 401);
  assert.equal((await req("POST", "/api/auth/login", { email: "joao@exemplo.com", senha: "senha-forte-1" })).s, 200);
});
test("documentos: gravar, ler, validar e apagar", async () => {
  assert.equal((await req("PUT", "/api/doc/profile", { onboarded: true, peso0: 89 })).s, 200);
  assert.equal((await req("PUT", "/api/doc/d_2026-10-12", { cardio: 25 })).s, 200);
  assert.equal((await req("PUT", "/api/doc/../etc", { x: 1 })).s, 404);
  assert.equal((await req("PUT", "/api/doc/hack", { x: 1 })).s, 400);
  assert.equal((await req("PUT", "/api/doc/profile", [1, 2])).s, 400);
  const g = await req("GET", "/api/data"); assert.equal(g.j.docs.profile.peso0, 89); assert.equal(g.j.docs["d_2026-10-12"].cardio, 25);
  assert.equal((await req("PUT", "/api/doc/ph_2026-10-12", { front: "x".repeat(950000) })).s, 413);
  const ex = await req("GET", "/api/export"); assert.equal(ex.j.docs.profile.onboarded, true);
  assert.equal((await req("DELETE", "/api/doc/d_2026-10-12")).s, 200);
  assert.equal(Object.keys((await req("GET", "/api/data")).j.docs).length, 1);
});
test("isolamento entre usuários e proteção de origem", async () => {
  const mine = jar; jar = "";
  await req("POST", "/api/auth/register", { email: "maria@exemplo.com", senha: "outra-senha-9" });
  assert.equal(Object.keys((await req("GET", "/api/data")).j.docs).length, 0);
  jar = mine; assert.equal((await req("PUT", "/api/doc/profile", { a: 1 }, { origin: "https://malicioso.com" })).s, 403);
});
test("troca de senha invalida sessões antigas", async () => {
  const old = jar;
  assert.equal((await req("POST", "/api/auth/password", { atual: "errada", nova: "nova-senha-123" })).s, 403);
  assert.equal((await req("POST", "/api/auth/password", { atual: "senha-forte-1", nova: "nova-senha-123" })).s, 200);
  const nova = jar; jar = old; assert.equal((await req("GET", "/api/auth/me")).s, 401); jar = nova; assert.equal((await req("GET", "/api/auth/me")).s, 200);
});
test("coach: streaming, ferramenta de proposta e limite diário", async () => {
  calls = [];
  const st = await req("GET", "/api/coach/status"); assert.equal(st.j.enabled, true);
  assert.equal((await req("POST", "/api/coach", { mode: "x", messages: [{ role: "user", content: "oi" }] })).s, 400);
  const r = await req("POST", "/api/coach", { mode: "nutri", messages: [{ role: "user", content: "Ajuste minha meta" }], context: "kcal 2450", plan: {} });
  assert.equal(r.s, 200);
  const ev = r.t.split("\n\n").filter(Boolean).map((x) => JSON.parse(x.replace(/^data: /, "")));
  assert.ok(ev.some((e) => e.type === "text" && e.delta === "Vou propor "));
  const prop = ev.find((e) => e.type === "proposal"); assert.equal(prop.proposal.type, "metas"); assert.equal(prop.proposal.kcal, 2300);
  assert.ok(ev.some((e) => e.type === "text" && e.delta === "Ok.")); assert.equal(ev.at(-1).type, "done");
  assert.equal(calls.length, 2); assert.ok(calls[0].system.includes("NUTRICIONISTA")); assert.ok(calls[0].system.includes("kcal 2450")); assert.equal(calls[0].tools.length, 5);
  assert.equal(calls[1].messages.at(-1).content[0].type, "tool_result");
  const bad = await req("POST", "/api/coach", { mode: "nutri", messages: [{ role: "user", content: "meta 1000" }], plan: {} }); assert.equal(bad.s, 200);
  const limit = await req("POST", "/api/coach", { mode: "personal", messages: [{ role: "user", content: "oi" }] }); assert.equal(limit.s, 200);
  const over = await req("POST", "/api/coach", { mode: "personal", messages: [{ role: "user", content: "oi" }] }); assert.equal(over.s, 429);
});

test("banco: migrações idempotentes e status", async () => {
  const { migrate, status, LATEST } = await import("../src/migrate.js");
  const { openDb } = await import("../src/db.js");
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "pv-mig-"));
  const db2 = await openDb({ dataDir: d, databaseUrl: "" });
  assert.deepEqual((await migrate(db2)).applied, []);
  const s = await status(db2);
  assert.equal(s.versaoDoEsquema, LATEST);
  assert.equal(s.integridade, "ok");
  assert.ok("users" in s.tabelas && "docs" in s.tabelas && "usage" in s.tabelas);
  await db2.close();
});

test("prompts master personal e nutri existem e citam a lógica principal", async () => {
  const { PERSONAL_RULES, NUTRI_RULES } = await import("../../shared/prompts.js");
  assert.match(PERSONAL_RULES, /AVALIAR/);
  assert.match(PERSONAL_RULES, /PERSONAL TRAINER|PERSONAL/i);
  assert.match(NUTRI_RULES, /AVALIAR/);
  assert.match(NUTRI_RULES, /NUTRICIONISTA/i);
  assert.match(PERSONAL_RULES, /propor_troca_exercicio|FERRAMENTAS/);
  assert.match(NUTRI_RULES, /propor_metas_dieta|FERRAMENTAS/);
});
