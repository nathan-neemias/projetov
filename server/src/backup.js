// Backup consistente do SQLite (funciona com o servidor rodando).
// Uso: node server/src/backup.js /data/backups/projeto-v-2026-10-12.sqlite
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
const dest = process.argv[2]; if (!dest) { console.error("Informe o arquivo de destino."); process.exit(1); }
const src = path.join(process.env.DATA_DIR || "./data", "projeto-v.sqlite");
fs.mkdirSync(path.dirname(dest), { recursive: true });
const db = new Database(src, { readonly: true, fileMustExist: true });
db.backup(dest).then(() => { console.log("Backup salvo em", dest); db.close(); }).catch((e) => { console.error("Falha no backup:", e.message); process.exit(1); });
