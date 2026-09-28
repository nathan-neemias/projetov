// Migrações versionadas do banco. Cada versão roda uma única vez, dentro de uma transação.
// Para mudar o esquema no futuro, adicione uma nova entrada no fim da lista (nunca edite as antigas).
const MIGRATIONS = [
  { v: 1, name: "esquema inicial (usuários, documentos, uso do coach)", sql: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS docs (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, id)
    );
    CREATE TABLE IF NOT EXISTS usage (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      coach_calls INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day)
    );` },
  { v: 2, name: "índice de documentos por atualização", sql: `CREATE INDEX IF NOT EXISTS docs_user_updated ON docs(user_id, updated_at);` },
];
export const LATEST = MIGRATIONS[MIGRATIONS.length - 1].v;

export function migrate(db) {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (v INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  const done = new Set(db.prepare("SELECT v FROM schema_migrations").all().map((r) => r.v));
  const applied = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.v)) continue;
    db.transaction(() => { db.exec(m.sql); db.prepare("INSERT INTO schema_migrations(v,name) VALUES(?,?)").run(m.v, m.name); })();
    applied.push(m.v);
  }
  return { version: LATEST, applied };
}

export function status(db, file) {
  const one = (q) => db.prepare(q).get();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((t) => t.name);
  const counts = Object.fromEntries(tables.map((t) => [t, one(`SELECT COUNT(*) c FROM "${t}"`).c]));
  const cur = one("SELECT MAX(v) v FROM schema_migrations").v;
  return { arquivo: file, versaoDoEsquema: cur, versaoEsperada: LATEST, sqlite: one("select sqlite_version() v").v, modoDeJornal: db.pragma("journal_mode", { simple: true }), integridade: db.pragma("integrity_check", { simple: true }), tabelas: counts };
}
