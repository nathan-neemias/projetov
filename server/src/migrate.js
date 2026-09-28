// Migrações versionadas do PostgreSQL. Cada versão roda uma vez, em transação.
// Para mudar o esquema, adicione uma nova entrada no fim (nunca edite as antigas).
const MIGRATIONS = [
  {
    v: 1,
    name: "esquema inicial (usuários, documentos, uso do coach)",
    sql: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS docs (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, id)
    );
    CREATE TABLE IF NOT EXISTS usage (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      coach_calls INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day)
    );`,
  },
  {
    v: 2,
    name: "índice de documentos por atualização",
    sql: `CREATE INDEX IF NOT EXISTS docs_user_updated ON docs(user_id, updated_at);`,
  },
];
export const LATEST = MIGRATIONS[MIGRATIONS.length - 1].v;

export async function migrate(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      v INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  const done = new Set((await db.many("SELECT v FROM schema_migrations")).map((r) => Number(r.v)));
  const applied = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.v)) continue;
    await db.tx(async (tx) => {
      await tx.query(m.sql);
      await tx.query("INSERT INTO schema_migrations(v, name) VALUES($1, $2)", [m.v, m.name]);
    });
    applied.push(m.v);
  }
  return { version: LATEST, applied };
}

export async function status(db) {
  const ver = await db.one("SELECT version() AS v");
  const cur = await db.one("SELECT MAX(v)::int AS v FROM schema_migrations");
  const tables = await db.many(`
    SELECT table_name AS name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name`);
  const counts = {};
  for (const t of tables) {
    const r = await db.one(`SELECT COUNT(*)::int AS c FROM "${t.name}"`);
    counts[t.name] = r.c;
  }
  return {
    motor: db.kind || "postgresql",
    versao: String(ver.v).split(",")[0],
    versaoDoEsquema: cur?.v ?? 0,
    versaoEsperada: LATEST,
    integridade: "ok",
    tabelas: counts,
  };
}
