import { EX, PLAN, GROUPS, MUSCLE_NAME } from "./data.js";
import { LIB, LIB_BY_ID } from "../../shared/lib.js";

const SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const LEGS = ["quads", "hams", "glutes"];
export const ACT_IDS = ["peck", "crucifixo"];

export const DEFAULT_PLAN = {
  mode: "padrao", over: {}, custom: {},
  days: {
    1: { title: "Peito e tríceps", tag: "Voador primeiro, depois pesado (6 a 10 reps)", ex: ["peck", "sup_inc", "sup_reto", "tri_corda", "tri_fr"] },
    2: { title: "Costas, ombro e bíceps", tag: "Largura das costas e ombro", ex: ["puxada", "remada", "pullover", "elev_cabo", "face_pull", "rosca_d", "rosca_m"] },
    3: { title: "Perna e abdômen", tag: "Dia forte de perna", ex: ["agacho", "leg", "stiff", "extensora", "flexora", "panturr", "abd_polia", "elev_perna"] },
    4: { title: "Peito e costas", tag: "Volume, 10 a 15 reps", ex: ["peck", "sup_maq", "cross_alto", "pux_sup", "rem_maq"] },
    5: { title: "Ombro, braço e abdômen", tag: "Ombro largo e braço", ex: ["desenv", "elev_cabo", "cruc_inv", "rosca_inc", "tri_barra", "prancha", "abd_maq"] },
  },
};

export function applyPlan(profile) {
  const plan = (profile && profile.plan) || DEFAULT_PLAN;
  Object.keys(EX).forEach((k) => delete EX[k]); Object.keys(PLAN).forEach((k) => delete PLAN[k]);
  LIB.forEach((e) => { EX[e.id] = { ...e }; });
  Object.entries(plan.custom || {}).forEach(([id, e]) => { EX[id] = { sec: [], cues: [], alias: [], eq: "maq", pri: [], kind: "iso", sets: 3, reps: [8, 12], rest: 90, inc: 2.5, effect: "Exercício personalizado.", ...e, id }; });
  Object.entries(plan.over || {}).forEach(([id, o]) => { if (EX[id]) EX[id] = { ...EX[id], ...o }; });
  Object.entries(plan.days || {}).forEach(([n, d]) => {
    const ids = d.ex.filter((id) => EX[id]);
    const legs = ids.some((id) => EX[id].pri.some((m) => LEGS.includes(m)));
    PLAN[n] = { title: d.title, short: SHORT[n - 1], tag: d.tag || (d.style === "volume" ? "Volume, 10 a 15 reps" : d.style === "pesado" ? "Pesado, 6 a 10 reps" : ""), cardio: legs ? "leve" : "intenso", ex: ids };
  });
  return plan;
}

const groupOf = (m) => (GROUPS.find(([, ms]) => ms.includes(m)) || [])[0];
export function autoTitle(ids, exOf) {
  const c = {};
  ids.forEach((id) => { const e = exOf(id); if (!e) return; e.pri.forEach((m) => { const g = groupOf(m); if (g) c[g] = (c[g] || 0) + e.sets; }); });
  const arr = Object.entries(c).sort((a, b) => b[1] - a[1]); if (!arr.length) return "Treino";
  const top = arr.filter((x, i) => i < 3 && x[1] >= arr[0][1] * 0.4).map((x) => x[0].toLowerCase());
  const s = top.length > 1 ? top.slice(0, -1).join(", ") + " e " + top[top.length - 1] : top[0];
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- gerador ---------- */
const C = (m) => ({ m, k: "comp" }), I = (m) => ({ m, k: "iso" });
const TPL = {
  push: { title: "Peito, ombro e tríceps", slots: [C("chest"), C("chest"), C("delt_f"), I("delt_l"), I("chest"), I("triceps"), I("delt_l"), I("triceps")] },
  pull: { title: "Costas e bíceps", slots: [C("lats"), C("midback"), C("lats"), I("delt_r"), I("biceps"), I("lats"), I("biceps")] },
  legs: { title: "Pernas e abdômen", slots: [C("quads"), C("quads"), C("hams"), I("hams"), I("quads"), I("calves"), I("abs"), I("abs")] },
  legsB: { title: "Pernas e abdômen", slots: [C("quads"), C("glutes"), C("hams"), I("quads"), I("hams"), I("calves"), I("abs")] },
  chestTri: { title: "Peito e tríceps", slots: [C("chest"), C("chest"), I("chest"), I("triceps"), I("triceps")] },
  backShBi: { title: "Costas, ombro e bíceps", slots: [C("lats"), C("midback"), C("lats"), I("delt_l"), I("delt_r"), I("biceps"), I("biceps")] },
  chestBack: { title: "Peito e costas", slots: [C("chest"), I("chest"), C("lats"), C("midback"), I("lats")] },
  shArmsAbs: { title: "Ombro, braço e abdômen", slots: [C("delt_f"), I("delt_l"), I("delt_r"), I("biceps"), I("biceps"), I("triceps"), I("abs"), I("abs")] },
  upperA: { title: "Superior A", slots: [C("chest"), C("lats"), C("midback"), I("delt_l"), I("triceps"), I("biceps"), I("delt_r")] },
  upperB: { title: "Superior B", slots: [C("delt_f"), C("chest"), C("lats"), I("delt_l"), I("biceps"), I("triceps"), I("chest")] },
  lowerA: { title: "Inferior A", slots: [C("quads"), C("hams"), C("quads"), I("hams"), I("calves"), I("abs")] },
  lowerB: { title: "Inferior B e abdômen", slots: [C("quads"), C("glutes"), I("quads"), I("hams"), I("calves"), I("abs"), I("abs")] },
};
const SPLITS = {
  3: { wd: [1, 3, 5], t: ["push", "pull", "legs"], vol: [] },
  4: { wd: [1, 2, 4, 5], t: ["upperA", "lowerA", "upperB", "lowerB"], vol: [2, 3] },
  5: { wd: [1, 2, 3, 4, 5], t: ["chestTri", "backShBi", "legs", "chestBack", "shArmsAbs"], vol: [3, 4] },
  6: { wd: [1, 2, 3, 4, 5, 6], t: ["push", "pull", "legs", "push", "pull", "legsB"], vol: [3, 4, 5] },
};
const EQS = {
  maquina: { maq: 2, cabo: 2, peso: 1, livre: 0.3 },
  livre: { livre: 2, peso: 1.5, cabo: 1, maq: 0.5 },
  misto_comp: { livre: 2, maq: 1.6, cabo: 1.4, peso: 1 },
  misto_iso: { cabo: 2, livre: 1.6, maq: 1.5, peso: 1 },
};
export const eqScore = (e, equip) => (equip === "misto" ? EQS["misto_" + (e.kind === "comp" ? "comp" : "iso")] : EQS[equip] || EQS.maquina)[e.eq] ?? 1;
const mins = (e) => (e.sets * (45 + e.rest)) / 60;

export function generatePlan({ days = 5, focus = "v", equip = "maquina", minutes = 75, variant = 0, common = true } = {}) {
  const sp = SPLITS[days] || SPLITS[5];
  const usedPlan = new Set(), out = {}, over = {};
  sp.wd.forEach((wd, di) => {
    const tpl = TPL[sp.t[di]], volume = sp.vol.includes(di);
    let slots = [...tpl.slots];
    const legDay = ["legs", "legsB", "lowerA", "lowerB"].includes(sp.t[di]);
    if (focus === "pb" && !legDay) { if (["push", "chestTri", "upperA", "upperB", "chestBack"].includes(sp.t[di])) slots.push(I("chest")); if (!slots.some((s) => s.m === "biceps")) slots.push(I("biceps")); if (!slots.some((s) => s.m === "triceps")) slots.push(I("triceps")); }
    if (focus === "v" && !legDay) {
      if (["pull", "backShBi", "upperA", "upperB"].includes(sp.t[di])) slots.push(I("lats"));
      const latDays = sp.t.filter((t) => TPL[t].slots.some((x) => x.m === "delt_l")).length;
      if (!slots.some((x) => x.m === "delt_l") && latDays < 2 && sp.t.indexOf(sp.t[di]) === di && (di === 0 || di === 3)) slots.push(I("delt_l"));
    }
    if (["push", "chestTri", "chestBack", "upperA", "upperB"].includes(sp.t[di])) {
      const ix = slots.findIndex((x) => x.m === "chest" && x.k === "iso"); if (ix > -1) slots.splice(ix, 1);
      slots.unshift({ m: "chest", k: "iso", pin: equip === "livre" ? "crucifixo" : "peck" });
    }
    const usedDay = new Set(), chosen = []; let total = 0;
    slots.forEach((slot, si) => {
      if (slot.pin) { const e = LIB_BY_ID[slot.pin]; if (e && (!common || !e.rare) && !usedDay.has(e.id)) { usedDay.add(e.id); usedPlan.add(e.id); chosen.push(e.id); total += mins(e); return; } }
      let cand = LIB.filter((e) => (!common || !e.rare) && e.pri.includes(slot.m) && (e.kind === slot.k || (slot.k === "iso" && e.kind === "time")) && !usedDay.has(e.id));
      if (!cand.length) return;
      const sc = cand.map((e) => ({ e, s: eqScore(e, equip) + (usedPlan.has(e.id) ? -3 : 0) })), best = Math.max(...sc.map((x) => x.s));
      const top = sc.filter((x) => x.s >= best - 0.01).map((x) => x.e), e = top[(variant + si + di) % top.length];
      if (chosen.length >= 4 && total + mins(e) > minutes + 2) return;
      usedDay.add(e.id); usedPlan.add(e.id); chosen.push(e.id); total += mins(e);
    });
    chosen.forEach((id) => { const e = LIB_BY_ID[id]; if (e.kind === "time" || e.bw) return; const r = volume ? (e.kind === "comp" ? [10, 12] : [12, 15]) : e.kind === "comp" ? [6, 10] : e.reps; if (r[0] !== e.reps[0] || r[1] !== e.reps[1]) over[id] = { reps: r }; });
    out[wd] = { title: tpl.title, style: volume ? "volume" : "pesado", ex: chosen };
  });
  const plan = { mode: "gerado", opts: { days, focus, equip, minutes, variant, common }, days: out, over, custom: {} };
  return refine(plan, equip, minutes, common);
}
function dayMins(plan, d) { return d.ex.reduce((a, id) => { const e = exDef(plan, id); return a + (e ? mins(e) : 0); }, 0); }
function refine(plan, equip, minutes, common) {
  for (let i = 0; i < 10; i++) {
    const an = analyzePlan(plan, equip, common);
    const add = an.tips.find((t) => t.kind === "add" && t.cands && t.cands.length);
    const over = an.tips.find((t) => t.over);
    if (add) {
      const wd = placeDay(plan, add.muscle), d = plan.days[wd], id = add.cands[0], e = LIB_BY_ID[id];
      if (!d || !e || dayMins(plan, d) + mins(e) > minutes + 12) { if (!over) break; } else { d.ex = [...d.ex, id]; continue; }
    }
    if (over) {
      const cand = Object.values(plan.days).map((d) => ({ d, k: d.ex.filter((id) => { const e = exDef(plan, id); return e && e.kind === "iso" && e.pri.some((m) => (GROUPS.find(([g]) => g === over.g) || [, []])[1].includes(m)); }) })).filter((x) => x.k.length).sort((a, b) => b.k.length - a.k.length)[0];
      if (!cand) break; cand.d.ex = cand.d.ex.filter((id) => id !== cand.k[cand.k.length - 1]); continue;
    }
    break;
  }
  return plan;
}

/* ---------- interpretar treino colado ---------- */
const STOP = new Set(["na", "no", "com", "de", "do", "da", "e", "o", "a", "em", "para", "os", "as", "um", "uma"]);
const stem = (t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t);
const toks = (s) => norm(s).split(" ").filter((t) => t && !STOP.has(t)).map(stem);
const DAYS = [["seg", 1], ["ter", 2], ["qua", 3], ["qui", 4], ["sex", 5], ["sab", 6], ["dom", 7]];
const LIB_TOK = LIB.map((e) => ({ e, t: new Set(toks(e.name + " " + (e.alias || []).join(" "))), names: [norm(e.name), ...(e.alias || []).map(norm)] }));
export function matchExercise(text, equip = "maquina") {
  const q = norm(text); if (!q) return null;
  const exact = LIB_TOK.filter((x) => x.names.includes(q)); if (exact.length) return exact.sort((a, b) => eqScore(b.e, equip) - eqScore(a.e, equip))[0].e;
  const qt = toks(text); if (!qt.length) return null;
  const sc = LIB_TOK.map((x) => { const hit = qt.filter((t) => x.t.has(t)).length; return { e: x.e, hit, ratio: hit / qt.length, extra: x.t.size - hit }; }).filter((x) => x.hit > 0);
  const full = sc.filter((x) => x.ratio === 1);
  const pool = full.length ? full : sc.filter((x) => x.ratio >= 0.6);
  if (!pool.length) return null;
  pool.sort((a, b) => a.extra - b.extra || eqScore(b.e, equip) - eqScore(a.e, equip));
  const bestExtra = pool[0].extra, ties = pool.filter((x) => x.extra <= bestExtra + 2);
  return ties.sort((a, b) => eqScore(b.e, equip) - eqScore(a.e, equip))[0].e;
}
export function parseWorkout(text, equip = "maquina") {
  const days = {}, over = {}, custom = {}, unmatched = []; let nextFree = 1, matched = 0;
  const lines = String(text).split(/\n+/).map((l) => l.trim()).filter(Boolean);
  lines.forEach((line) => {
    let wd = null, body = line, hint = "";
    const m = norm(line).match(/^(seg|ter|qua|qui|sex|sab|dom)[a-z]*/);
    const idx = line.search(/[:\-–—]/);
    if (m && idx > -1) { wd = DAYS.find(([k]) => k === m[1])[1]; body = line.slice(idx + 1); const par = line.match(/\(([^)]+)\)/); if (par) hint = par[1].trim(); }
    else if (m && line.split(/[,;]/).length === 1) return;
    if (wd === null) { while (days[nextFree] && nextFree < 7) nextFree++; wd = nextFree; }
    const items = body.split(/[,;]/).map((s) => s.replace(/^[\s\-•*\d.)]+/, "").trim()).filter(Boolean);
    const ids = days[wd]?.ex || [];
    items.forEach((raw) => {
      let name = raw, sets = null, reps = null;
      const sr = raw.match(/(\d+)\s*x\s*(\d+)(?:\s*(?:-|a)\s*(\d+))?/i);
      if (sr) { sets = +sr[1]; reps = [+sr[2], +(sr[3] || sr[2])]; name = raw.replace(sr[0], "").replace(/[()]/g, "").trim(); }
      if (!name) return;
      const e = matchExercise(name, equip); let id;
      if (e) { id = e.id; matched++; }
      else {
        const base = norm(name).replace(/ /g, "_").slice(0, 24); id = "c_" + base; unmatched.push(name);
        custom[id] = { name: name.charAt(0).toUpperCase() + name.slice(1), pri: [], sec: [], eq: "maq", kind: "iso", sets: sets || 3, reps: reps || [8, 12], rest: 90, inc: 2.5, effect: "Exercício personalizado.", cues: [], unknown: true };
      }
      if (!ids.includes(id)) ids.push(id);
      if (sets && e) over[id] = { ...(over[id] || {}), sets, reps };
      if (sets && !e) { custom[id].sets = sets; custom[id].reps = reps; }
    });
    days[wd] = { ex: ids, hint };
  });
  const exOf = (id) => custom[id] || LIB_BY_ID[id];
  const out = {};
  Object.entries(days).forEach(([n, d]) => { if (d.ex.length) out[n] = { title: d.hint ? d.hint.charAt(0).toUpperCase() + d.hint.slice(1) : autoTitle(d.ex, exOf), style: "", ex: d.ex }; });
  return { mode: "custom", days: out, over, custom, unmatched, matched };
}

/* ---------- análise e sugestões do treino montado ---------- */
export const TARGETS = { Costas: [12, 24], Ombros: [12, 24], Peito: [10, 18], "Bíceps": [8, 16], "Tríceps": [8, 16], Pernas: [12, 22], "Abdômen": [6, 14] };
export const GROUP_MUSCLE = { Costas: "lats", Ombros: "delt_l", Peito: "chest", "Bíceps": "biceps", "Tríceps": "triceps", Pernas: "quads", "Abdômen": "abs" };
export function candidatesFor(muscle, equip, exclude = [], n = 2, common = true) {
  const c = LIB.filter((e) => (!common || !e.rare) && e.pri.includes(muscle) && !exclude.includes(e.id)).map((e) => ({ e, s: eqScore(e, equip) + (e.kind === "iso" ? 0.05 : 0) })).sort((a, b) => b.s - a.s);
  return c.slice(0, n).map((x) => x.e.id);
}
export function analyzePlan(plan, equip = "maquina", common = true) {
  const exOf = (id) => (plan.custom && plan.custom[id]) ? { ...LIB_BY_ID[id], ...plan.custom[id] } : { ...LIB_BY_ID[id], ...((plan.over || {})[id] || {}) };
  const withOver = (id) => { const b = plan.custom?.[id] || LIB_BY_ID[id]; return b ? { ...b, ...((plan.over || {})[id] || {}) } : null; };
  const sets = {}, freq = {}; GROUPS.forEach(([g]) => { sets[g] = 0; freq[g] = new Set(); });
  let lat = 0, rear = 0; const all = [];
  Object.entries(plan.days).forEach(([n, d]) => d.ex.forEach((id) => {
    const e = withOver(id); if (!e) return; all.push(id);
    GROUPS.forEach(([g, ms]) => { if (e.pri.some((m) => ms.includes(m))) { sets[g] += e.sets; freq[g].add(n); } });
    if (e.pri.includes("delt_l")) lat += e.sets; if (e.pri.includes("delt_r")) rear += e.sets;
  }));
  const tips = [], nd = Object.keys(plan.days).length;
  GROUPS.forEach(([g]) => {
    const [lo, hi] = TARGETS[g];
    if (sets[g] < lo) tips.push({ kind: "add", g, text: `${g}: ${sets[g]} séries por semana. O ideal é de ${lo} a ${hi} para crescer.`, muscle: GROUP_MUSCLE[g], cands: candidatesFor(GROUP_MUSCLE[g], equip, all, 2, common) });
    else if (sets[g] > hi + 2) tips.push({ kind: "warn", over: true, g, text: `${g}: ${sets[g]} séries por semana, acima do teto de ${hi}. Mais que isso costuma virar volume desperdiçado e atrapalha a recuperação.` });
    else if (freq[g].size < 2 && ["Costas", "Ombros", "Peito"].includes(g) && sets[g] >= lo) tips.push({ kind: "info", text: `${g} é treinado só 1 dia por semana. Dividir em 2 dias costuma dar mais crescimento com o mesmo volume.` });
  });
  if (lat < 8 && !tips.some((t) => t.muscle === "delt_l")) tips.push({ kind: "add", g: "Ombros", text: `Ombro lateral: ${lat} séries por semana. Para o formato em V, busque pelo menos 8.`, muscle: "delt_l", cands: candidatesFor("delt_l", equip, all, 2, common) });
  if (rear < 4) tips.push({ kind: "add", g: "Ombros", text: `Ombro posterior: ${rear} séries por semana. Adicione pelo menos 4 para equilibrar e proteger o ombro.`, muscle: "delt_r", cands: candidatesFor("delt_r", equip, all, 2, common) });
  if (nd >= 6) tips.push({ kind: "info", text: `${nd} dias de treino exigem boa recuperação. Mantenha pelo menos 1 dia de descanso completo e vigie o sono.` });
  if (nd <= 2) tips.push({ kind: "info", text: "Com 2 dias ou menos, o ganho fica limitado. Se possível, treine 3 a 5 dias por semana." });
  Object.entries(plan.days).forEach(([n, d]) => {
    const t = d.ex.reduce((a, id) => { const e = withOver(id); return a + (e ? mins(e) : 0); }, 0);
    if (t > 100) tips.push({ kind: "warn", text: `${SHORT[n - 1]}: cerca de ${Math.round(t)} min. Treinos acima de 90 min tendem a cair de qualidade.` });
    const ks = d.ex.filter((id, i) => !(i === 0 && ACT_IDS.includes(id))).map((id) => withOver(id)?.kind);
    const firstComp = ks.indexOf("comp"), lastIso = ks.lastIndexOf("iso");
    if (firstComp > -1 && ks.indexOf("iso") > -1 && ks.indexOf("iso") < firstComp) tips.push({ kind: "order", n, text: `${SHORT[n - 1]}: há isoladores antes dos exercícios compostos. Comece pelos compostos, quando você está mais forte.` });
  });
  const unknown = all.filter((id) => plan.custom?.[id]?.unknown || (plan.custom?.[id] && !plan.custom[id].pri.length));
  if (unknown.length) tips.push({ kind: "info", text: `${unknown.length} exercício(s) sem grupo muscular definido: eles não entram na conta de volume. Defina o músculo na lista.` });
  return { sets, freq: Object.fromEntries(Object.entries(freq).map(([g, s]) => [g, s.size])), tips };
}
export function placeDay(plan, muscle) {
  const days = Object.entries(plan.days); if (!days.length) return null;
  const has = days.filter(([, d]) => d.ex.some((id) => { const e = plan.custom?.[id] || LIB_BY_ID[id]; return e && e.pri.includes(muscle); }));
  const pool = has.length ? has : days;
  return pool.sort((a, b) => a[1].ex.length - b[1].ex.length)[0][0];
}
export function sortCompoundsFirst(d, plan) {
  const k = (id) => (plan.custom?.[id] || LIB_BY_ID[id])?.kind;
  const rank = (id) => (k(id) === "comp" ? 0 : k(id) === "iso" ? 1 : 2);
  const lead = d.ex.length && ACT_IDS.includes(d.ex[0]) ? [d.ex[0]] : [], rest = d.ex.slice(lead.length);
  return [...lead, ...rest.map((id, i) => [id, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map((x) => x[0])];
}
export const exDef = (plan, id) => { const b = plan.custom?.[id] || LIB_BY_ID[id]; return b ? { ...b, ...((plan.over || {})[id] || {}) } : null; };
export { SHORT };
export const clonePlan = (p) => JSON.parse(JSON.stringify(p || DEFAULT_PLAN));
