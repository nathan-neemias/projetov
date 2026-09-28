// Servidor de teste para o navegador: sobe a API + o front compilado, com uma "Anthropic" falsa.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../src/app.js";
const sse = (ev) => ev.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
const mock = http.createServer((req, res) => {
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
    const j = JSON.parse(b), hasRes = j.messages.some((m) => Array.isArray(m.content) && m.content.some((x) => x.type === "tool_result")), last = JSON.stringify(j.messages.at(-1));
    res.writeHead(200, { "content-type": "text/event-stream" });
    global.__last = j;
    if (!hasRes && /estagnado/i.test(last)) return res.end(sse([{ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }, { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Vou sugerir uma troca. " } }, { type: "content_block_stop", index: 0 }, { type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "t1", name: "propor_troca_exercicio" } }, { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '{"dia":1,"sai_id":"sup_reto","entra_id":"sup_maq","motivo":"variar o ângulo"}' } }, { type: "content_block_stop", index: 1 }, { type: "message_delta", delta: { stop_reason: "tool_use" } }]));
    res.end(sse([{ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }, { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Resposta do **coach**: contexto de " + j.system.length + " caracteres." } }, { type: "content_block_stop", index: 0 }, { type: "message_delta", delta: { stop_reason: "end_turn" } }]));
  });
});
await new Promise((r) => mock.listen(0, r));
const { app } = createApp({ dataDir: fs.mkdtempSync(path.join(os.tmpdir(), "pv-e2e-")), webDir: path.resolve("../web/dist"), anthropicKey: "k", anthropicBase: `http://127.0.0.1:${mock.address().port}`, jwtSecret: "y".repeat(40), port: 8099 });
http.createServer(app).listen(8099, () => console.log("pronto em 8099"));
