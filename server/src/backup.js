// Exporta um dump SQL lógico via pg_dump (chamado pelo backup.sh).
// Uso: node server/src/backup.js /data/backups/backup-2026-10-12.sql
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dest = process.argv[2];
if (!dest) { console.error("Informe o arquivo de destino (.sql)."); process.exit(1); }
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL não definida."); process.exit(1); }

fs.mkdirSync(path.dirname(dest), { recursive: true });
const r = spawnSync("pg_dump", ["--no-owner", "--format=plain", "--file", dest, process.env.DATABASE_URL], { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout || "pg_dump falhou");
  process.exit(1);
}
console.log("Backup salvo em", dest);
