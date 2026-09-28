// Camada de dados: fala com a API do servidor (Node + SQLite). O estado fica na memória
// da tela e cada alteração é gravada com atraso curto e nova tentativa em caso de falha.
let user = null;

export class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status; } }
async function api(path, { method = "GET", body, signal } = {}) {
  const r = await fetch("/api" + path, { method, signal, credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch { /* sem corpo */ }
  if (!r.ok) throw new ApiError((j && j.erro) || "Falha na comunicação com o servidor.", r.status);
  return j;
}
export { api };

export async function currentUser() { try { user = (await api("/auth/me")).user; } catch { user = null; } return user; }
export async function login(email, senha) { user = (await api("/auth/login", { method: "POST", body: { email, senha } })).user; return user; }
export async function register(email, senha, nome) { user = (await api("/auth/register", { method: "POST", body: { email, senha, nome } })).user; return user; }
export async function logout() { await api("/auth/logout", { method: "POST" }).catch(() => {}); user = null; }
export const changePassword = (atual, nova) => api("/auth/password", { method: "POST", body: { atual, nova } });
export const getUser = () => user;

export async function loadAll() {
  const state = { profile: null, days: {}, photos: {} };
  const { docs } = await api("/data");
  for (const [id, v] of Object.entries(docs)) {
    if (id === "profile") state.profile = v;
    else if (id.startsWith("d_")) state.days[id.slice(2)] = v;
    else if (id.startsWith("ph_")) state.photos[id.slice(3)] = v;
  }
  return state;
}

const timers = {}, chains = {};
export function queueSave(id, data, onStatus) {
  clearTimeout(timers[id]);
  timers[id] = setTimeout(() => {
    const run = async () => {
      onStatus && onStatus("saving");
      for (let tries = 0; tries < 4; tries++) {
        try { await api("/doc/" + id, { method: "PUT", body: data }); onStatus && onStatus("saved"); return; }
        catch (e) { if (e.status === 401) { onStatus && onStatus("auth"); return; } if (e.status && e.status < 500) { onStatus && onStatus("error"); return; } await new Promise((r) => setTimeout(r, 1500 * (tries + 1))); }
      }
      onStatus && onStatus("error");
    };
    chains[id] = (chains[id] || Promise.resolve()).then(run);
  }, 500);
}
export const wipe = () => api("/data", { method: "DELETE" });
export const importData = (docs) => api("/import", { method: "POST", body: { docs } });
export async function exportData() {
  const r = await fetch("/api/export", { credentials: "same-origin" }); if (!r.ok) throw new ApiError("Não foi possível exportar.", r.status);
  const blob = await r.blob(), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `projeto-v-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
