import { EX, PLAN, GROUPS } from "./data.js";
export const pad = (n) => String(n).padStart(2, "0");
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const todayIso = () => iso(new Date());
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const diffDays = (a, b) => { const x = parse(a), y = parse(b); return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000); };
export const fmtDM = (s) => { const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
export const fmtLong = (s) => parse(s).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
export const dow = (s) => { const d = parse(s).getDay(); return d === 0 ? 7 : d; };
export const mondayOf = (s) => addDays(s, -(dow(s) - 1));
export const weekOf = (start, s) => Math.min(13, Math.max(1, Math.floor(diffDays(start, s) / 7) + 1));
export const targetName = (t) => (String(t).slice(5) === "12-25" ? "o Natal" : "a meta");
export const num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(n) ? 0 : n; };
export const r1 = (n) => Math.round(n * 10) / 10;
export const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${pad(Math.max(0, s) % 60)}`;
export const e1rm = (kg, reps) => kg * (1 + reps / 30);
export const signed = (n, d = 1) => (n > 0 ? "+" : n < 0 ? "-" : "") + Math.abs(n).toFixed(d);

export function lastSession(days, exId, before) {
  const dates = Object.keys(days).filter((d) => d < before && (days[d].sets?.[exId] || []).some((s) => s.done)).sort();
  if (!dates.length) return null;
  const d = dates[dates.length - 1];
  return { date: d, sets: days[d].sets[exId].filter((s) => s.done) };
}
// Progressão dupla: bateu o topo da faixa em todas as séries => sobe a carga.
export function suggest(ex, last, deload) {
  const [lo, hi] = ex.reps;
  if (ex.kind === "time") {
    if (!last) return { kg: 0, reps: lo, text: `Meta: ${lo} segundos por série.` };
    const best = Math.max(...last.sets.map((s) => num(s.reps))), next = Math.min(best + 5, 90);
    return { kg: 0, reps: next, up: next > best, text: `Última vez: ${best} s. Meta de hoje: ${next} s.` };
  }
  if (ex.bw) {
    if (!last) return { kg: 0, reps: lo, text: `Meta: ${lo} a ${hi} repetições por série.` };
    const mr = Math.min(...last.sets.map((s) => num(s.reps)));
    return { kg: 0, reps: Math.min(hi, mr + 1), text: `Última vez: ${last.sets.map((s) => num(s.reps)).join(", ")} reps. Tente mais 1 em cada série.` };
  }
  if (!last) return { kg: null, reps: lo, text: `Primeira vez: escolha uma carga em que você chegue perto da falha em ${lo} a ${hi} repetições.` };
  const w = Math.max(...last.sets.map((s) => num(s.kg)));
  const atW = last.sets.filter((s) => num(s.kg) === w);
  const minReps = Math.min(...atW.map((s) => num(s.reps)));
  const resumo = last.sets.map((s) => `${num(s.kg)}×${num(s.reps)}`).join(" · ");
  if (deload) return { kg: w, reps: lo, text: `Deload: mesma carga de ${w} kg, metade das séries, sem ir à falha. Última vez: ${resumo}` };
  if (ex.inc > 0 && atW.length >= Math.min(ex.sets, 3) && minReps >= hi) {
    const nw = Math.round((w + ex.inc) * 100) / 100;
    return { kg: nw, reps: lo, up: true, text: `Suba para ${nw} kg. Você bateu ${hi} reps com ${w} kg. Última vez: ${resumo}` };
  }
  const tr = Math.min(hi, Math.max(lo, minReps + 1));
  return { kg: w, reps: tr, text: `Mantenha ${w} kg e busque ${tr} reps em todas as séries. Última vez: ${resumo}` };
}

export const planMuscles = (ids) => {
  const pri = new Set(), sec = new Set();
  ids.forEach((id) => { EX[id].pri.forEach((m) => pri.add(m)); EX[id].sec.forEach((m) => sec.add(m)); });
  return { pri: [...pri], sec: [...sec] };
};
export const dayMinutes = (ids) => Math.round(ids.reduce((a, id) => a + EX[id].sets * (45 + EX[id].rest), 0) / 60);
export function weeklySets() {
  const out = {};
  GROUPS.forEach(([g, ms]) => { out[g] = 0; });
  Object.values(PLAN).forEach((p) => p.ex.forEach((id) => {
    const ex = EX[id];
    GROUPS.forEach(([g, ms]) => { if (ex.pri.some((m) => ms.includes(m))) out[g] += ex.sets; });
  }));
  return out;
}
export const sessionVolume = (day) => Object.values(day.sets || {}).reduce((a, arr) => a + arr.filter((s) => s.done).reduce((b, s) => b + num(s.kg) * num(s.reps), 0), 0);
export const dayDoneSets = (day) => Object.values(day.sets || {}).reduce((a, arr) => a + arr.filter((s) => s.done).length, 0);
