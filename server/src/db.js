import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "./migrate.js";

export function openDb(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "projeto-v.sqlite");
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  db.dbFile = file;
  return db;
}
