// Administração pelo terminal.  Exemplos:
//   node server/src/cli.js users
//   node server/src/cli.js reset-password joao@exemplo.com NovaSenha123
//   node server/src/cli.js delete-user joao@exemplo.com
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { openDb } from "./db.js";
import { status } from "./migrate.js";
import fs from "node:fs";
const db = openDb(config.dataDir), [cmd, a, b] = process.argv.slice(2);
if (cmd === "users") { for (const u of db.prepare("SELECT id,email,name,created_at FROM users ORDER BY id").all()) console.log(`${u.id}\t${u.email}\t${u.name}\t${u.created_at}`); }
else if (cmd === "reset-password" && a && b) {
  if (b.length < 8) { console.error("A senha precisa ter pelo menos 8 caracteres."); process.exit(1); }
  const r = db.prepare("UPDATE users SET hash=?, token_version=token_version+1 WHERE email=?").run(await bcrypt.hash(b, 11), a.toLowerCase());
  console.log(r.changes ? "Senha alterada." : "Usuário não encontrado.");
} else if (cmd === "delete-user" && a) { const r = db.prepare("DELETE FROM users WHERE email=?").run(a.toLowerCase()); console.log(r.changes ? "Usuário e dados apagados." : "Usuário não encontrado."); }
else if (cmd === "db-status") {
  const s = status(db, db.dbFile), kb = Math.round(fs.statSync(db.dbFile).size / 1024);
  console.log(`Banco: ${s.arquivo} (${kb} KB)\nSQLite ${s.sqlite}, jornal ${s.modoDeJornal}, integridade: ${s.integridade}\nEsquema: versão ${s.versaoDoEsquema} de ${s.versaoEsperada}${s.versaoDoEsquema === s.versaoEsperada ? " (atualizado)" : " (DESATUALIZADO)"}\nTabelas: ${Object.entries(s.tabelas).map(([t, n]) => `${t}=${n}`).join(", ")}`);
  if (s.integridade !== "ok" || s.versaoDoEsquema !== s.versaoEsperada) process.exitCode = 1;
} else console.log("Comandos: users | db-status | reset-password <email> <nova-senha> | delete-user <email>");
db.close();
