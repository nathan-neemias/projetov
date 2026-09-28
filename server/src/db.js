import pg from "pg";
import path from "node:path";
import { migrate } from "./migrate.js";

const { Pool } = pg;

/** Interface única: Pool (produção) ou PGlite (testes). */
export function wrapClient(client, { isPool = false } = {}) {
  const query = (sql, params = []) => client.query(sql, params);
  return {
    query,
    one: async (sql, params) => (await query(sql, params)).rows[0],
    many: async (sql, params) => (await query(sql, params)).rows,
    async tx(fn) {
      if (isPool) {
        const c = await client.connect();
        try {
          await c.query("BEGIN");
          const nested = wrapClient(c, { isPool: false });
          const result = await fn(nested);
          await c.query("COMMIT");
          return result;
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      await client.query("BEGIN");
      try {
        const result = await fn(wrapClient(client, { isPool: false }));
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    },
    async close() {
      if (typeof client.end === "function") await client.end();
      else if (typeof client.close === "function") await client.close();
    },
  };
}

export async function openDb(config) {
  let db;
  if (config.databaseUrl) {
    const pool = new Pool({ connectionString: config.databaseUrl, max: 10 });
    db = wrapClient(pool, { isPool: true });
    db.kind = "postgres";
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const loc = config.dataDir ? path.join(config.dataDir, "pglite") : undefined;
    const client = new PGlite(loc);
    db = wrapClient(client, { isPool: false });
    db.kind = "pglite";
  }
  await migrate(db);
  return db;
}
