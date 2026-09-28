// Administração pelo terminal.  Exemplos:
//   node server/src/cli.js users
//   node server/src/cli.js reset-password joao@exemplo.com NovaSenha123
//   node server/src/cli.js delete-user joao@exemplo.com
//   node server/src/cli.js create-user email senha [nome]
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { openDb } from "./db.js";
import { status } from "./migrate.js";

const db = await openDb(config);
const [cmd, a, b, c] = process.argv.slice(2);

try {
  if (cmd === "users") {
    for (const u of await db.many("SELECT id,email,name,created_at FROM users ORDER BY id")) {
      console.log(`${u.id}\t${u.email}\t${u.name}\t${u.created_at}`);
    }
  } else if (cmd === "create-user" && a && b) {
    if (b.length < 8) { console.error("A senha precisa ter pelo menos 8 caracteres."); process.exitCode = 1; }
    else {
      const em = a.toLowerCase();
      if (await db.one("SELECT 1 AS x FROM users WHERE email=$1", [em])) console.error("E-mail já cadastrado.");
      else {
        const u = await db.one("INSERT INTO users(email,name,hash) VALUES($1,$2,$3) RETURNING id,email,name", [em, String(c || "").trim().slice(0, 80), await bcrypt.hash(b, 11)]);
        console.log(`Criado: ${u.id}\t${u.email}\t${u.name}`);
      }
    }
  } else if (cmd === "reset-password" && a && b) {
    if (b.length < 8) { console.error("A senha precisa ter pelo menos 8 caracteres."); process.exitCode = 1; }
    else {
      const r = await db.query("UPDATE users SET hash=$1, token_version=token_version+1 WHERE email=$2", [await bcrypt.hash(b, 11), a.toLowerCase()]);
      console.log(r.rowCount ? "Senha alterada." : "Usuário não encontrado.");
    }
  } else if (cmd === "delete-user" && a) {
    const r = await db.query("DELETE FROM users WHERE email=$1", [a.toLowerCase()]);
    console.log(r.rowCount ? "Usuário e dados apagados." : "Usuário não encontrado.");
  } else if (cmd === "db-status") {
    const s = await status(db);
    console.log(`Banco: ${s.motor} (${s.versao})\nEsquema: versão ${s.versaoDoEsquema} de ${s.versaoEsperada}${s.versaoDoEsquema === s.versaoEsperada ? " (atualizado)" : " (DESATUALIZADO)"}\nIntegridade: ${s.integridade}\nTabelas: ${Object.entries(s.tabelas).map(([t, n]) => `${t}=${n}`).join(", ")}`);
    if (s.integridade !== "ok" || s.versaoDoEsquema !== s.versaoEsperada) process.exitCode = 1;
  } else {
    console.log("Comandos: users | db-status | create-user <email> <senha> [nome] | reset-password <email> <nova-senha> | delete-user <email>");
  }
} finally {
  await db.close();
}
