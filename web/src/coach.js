import { PLAN, EX, SUPPS, WEEK_FOCUS, DELOAD_WEEK } from "./data.js";
import { LIB_BY_ID } from "../../shared/lib.js";
import { computeInsights, insightsText } from "./insights.js";
import { FOODS, homeQty } from "./diet.js";
import { targetName, weekOf, dow, mondayOf, addDays, diffDays, fmtDM, num, r1, weeklySets, sessionVolume, dayDoneSets } from "./util.js";

export const CHIPS = {
  personal: ["O que treino hoje?", "Estou estagnado", "Meu treino está volumoso?", "Estou cansado, ajusta meu treino", "Analise minha evolução", "Quanto descansar entre as séries?"],
  nutri: ["Analise minha dieta de hoje", "Estou com muita fome", "Parei de emagrecer", "O que comer antes do treino?", "Quanto de proteína preciso?", "Posso trocar o frango por outra coisa?"],
};
export const PHOTOS = {
  personal: [["maquina", "Foto de máquina", "Identifique esta máquina: função, músculos, regulagem, pegada, execução, séries e repetições, e onde encaixar no meu treino."], ["fisico", "Foto do físico", "Analise meu físico só pelo que é observável e diga as prioridades de treino."]],
  nutri: [["prato", "Foto do prato", "Analise este prato: alimentos, quantidades aproximadas (com faixa), calorias e macros, e como se encaixa na minha meta."], ["rotulo", "Foto de rótulo", "Analise este rótulo (por porção e por 100 g) e diga se vale a pena para minha meta."]],
};

const sorted = (p) => [...(p.measures || [])].sort((a, b) => a.date.localeCompare(b.date));
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
function weightTrend(profile, date) {
  const w = sorted(profile).filter((m) => m.peso), inR = (a, b) => w.filter((m) => m.date > addDays(date, -a) && m.date <= addDays(date, -b)).map((m) => m.peso);
  const A = avg(inR(7, 0)), B = avg(inR(14, 7));
  return { A, B, d: A != null && B != null ? A - B : null };
}
function measuresText(profile, date) {
  const ms = sorted(profile).slice(-12), t = weightTrend(profile, date);
  const lines = ms.map((m) => `${fmtDM(m.date)}: ${m.peso ? m.peso + " kg" : "-"}${m.cintura ? " · cintura " + m.cintura + " cm" : ""}`);
  return `${lines.join("; ") || "sem medidas"}\nMédia 7 dias: ${t.A != null ? r1(t.A) + " kg" : "sem dados"}; semana anterior: ${t.B != null ? r1(t.B) + " kg" : "sem dados"}; variação: ${t.d != null ? (t.d > 0 ? "+" : "") + r1(t.d) + " kg" : "sem dados"}`;
}
function planText() {
  return Object.entries(PLAN).map(([n, p]) => `${p.short} (dia ${n}) ${p.title}: ` + p.ex.map((id) => `${EX[id].name} [${id}] ${EX[id].sets}x${EX[id].kind === "time" ? EX[id].reps[0] + "s" : EX[id].reps.join("-")}${EX[id].rir ? " RIR " + EX[id].rir : ""} desc ${EX[id].rest}s`).join("; ")).join("\n");
}
function trainingText(days, date) {
  const ds = Object.keys(days).filter((d) => days[d].sets && Object.values(days[d].sets).some((a) => a.some((s) => s.done))).sort().slice(-6);
  if (!ds.length) return "nenhum treino registrado ainda";
  return ds.map((d) => {
    const ex = Object.entries(days[d].sets).map(([id, arr]) => { const done = arr.filter((s) => s.done); if (!done.length || !EX[id]) return null; return `${EX[id].name}: ${done.map((s) => `${num(s.kg) || "-"}x${num(s.reps)}`).join(" ")}`; }).filter(Boolean).slice(0, 8);
    return `${fmtDM(d)}${days[d].finished ? "" : " (incompleto)"} · ${dayDoneSets(days[d])} séries: ${ex.join(" | ")}`;
  }).join("\n");
}
function weekText(days, date) {
  const mon = mondayOf(date); let tr = 0, card = 0, planned = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(mon, i); if (PLAN[i + 1]) planned++; if (days[d]?.finished) tr++; if (days[d]?.cardio) card++; }
  return `treinos concluídos ${tr} de ${planned} planejados; cardio em ${card} dias`;
}
function checkinsText(profile) {
  const c = (profile.checkins || []).slice(-4);
  return c.length ? c.map((x) => `${fmtDM(x.date)}: peso médio ${x.peso || "-"}, cintura ${x.cintura || "-"}, treinos ${x.treinos ?? "-"}, cardio ${x.cardio ?? "-"} dias, fome ${x.fome}/5, energia ${x.energia}/5, sono ${x.sono} h, fadiga ${x.fadiga}/5, dor: ${x.dor || "nenhuma"}, aderência à dieta ${x.adesao}%, refeições fora ${x.fora}${x.obs ? ", obs: " + x.obs : ""}`).join("\n") : "nenhum ainda";
}
function baseProfile(S) {
  const { profile, date } = S, before = date < profile.start, wk = weekOf(profile.start, date);
  return `Peso inicial ${profile.peso0} kg; altura ${profile.altura} cm. Plano de ${fmtDM(profile.start)} a ${fmtDM(profile.target)} (${targetName(profile.target)}), ${before ? "ainda não começou" : `semana ${wk} de 13 (${WEEK_FOCUS[wk]}${wk === DELOAD_WEEK ? "; semana de deload planejada" : ""})`}. Hoje: ${date}, dia ${dow(date)} da semana. Objetivo: shape estético em V, com perda de gordura (corte). Metas: ${S.goal.kcal} kcal, ${S.goal.p} g de proteína, ${S.goal.c} g de carboidrato, ${S.goal.g} g de gordura; ${S.mealsN} refeições por dia.`;
}
export function buildContext(mode, S) {
  const { profile, days, date, menu } = S;
  if (mode === "personal") {
    const ws = weeklySets(), today = PLAN[dow(date)];
    return `${baseProfile(S)}
Modo do treino: ${(profile.plan || {}).mode || "padrao"}. Aparelhos: ${profile.onlyCommon === false ? "todos" : "só os que toda academia tem"}.
PLANO ATUAL:
${planText()}
Treino de hoje: ${today ? today.title : "descanso"}.
SÉRIES POR SEMANA POR GRUPO (planejado): ${Object.entries(ws).map(([g, v]) => `${g} ${v}`).join(", ")}.
ÚLTIMOS TREINOS (carga x repetições):
${trainingText(days, date)}
ESTA SEMANA: ${weekText(days, date)}.
MEDIDAS: ${measuresText(profile, date)}
CHECK-INS:
${checkinsText(profile)}
INSIGHTS AUTOMÁTICOS DO APP:
${insightsText(computeInsights(S))}`;
  }
  const pantry = Object.keys(profile.pantry || {}).filter((id) => profile.pantry[id] && FOODS[id]).map((id) => FOODS[id].n);
  const day = days[date] || {}, meals = day.meals || {};
  const eaten = Object.values(meals).reduce((a, x) => (x && typeof x === "object" ? { p: a.p + x.p, c: a.c + x.c, g: a.g + x.g } : a), { p: 0, c: 0, g: 0 });
  const menuTxt = menu.empty ? "sem cardápio (nenhum alimento marcado)" : menu.meals.map((m, i) => `${meals[i] ? "[comida] " : ""}${m.name} (${m.time}): ` + m.items.map(([id, q]) => { const h = homeQty(id, q); return `${FOODS[id].n} ${h.main}${h.sub ? " (" + h.sub + ")" : ""}`; }).join("; ") + ` → P ${Math.round(m.p)} C ${Math.round(m.c)} G ${Math.round(m.g)} · ${Math.round(m.kcal)} kcal`).join("\n");
  const supps = SUPPS.filter((s) => (s.food ? (profile.pantry || {}).whey : (profile.supps || {})[s.id])).map((s) => s.name);
  return `${baseProfile(S)}
ALIMENTOS QUE ELE TEM (marcados no Mercado): ${pantry.join(", ") || "nenhum"}.
CARDÁPIO DE HOJE:
${menuTxt}
JÁ COMEU HOJE: P ${Math.round(eaten.p)} g, C ${Math.round(eaten.c)} g, G ${Math.round(eaten.g)} g; água ${((day.water || 0) / 1000).toFixed(1)} L.
SUPLEMENTOS QUE TEM: ${supps.join(", ") || "nenhum"}.
TREINO: ${Object.keys(PLAN).length} dias por semana, musculação + cardio de 20–30 min (inclinação alta). ${weekText(days, date)}.
MEDIDAS: ${measuresText(profile, date)}
CHECK-INS:
${checkinsText(profile)}
INSIGHTS AUTOMÁTICOS DO APP:
${insightsText(computeInsights(S))}`;
}

export const proposalLabel = (p) => {
  if (p.type === "troca") return `Trocar ${EX[p.sai]?.name || p.sai} por ${LIB_BY_ID[p.entra]?.name || p.entra} (${PLAN[p.dia]?.short || "dia " + p.dia})`;
  if (p.type === "descanso") return `Descanso de ${EX[p.id]?.name || p.id}: ${p.s} s`;
  if (p.type === "metas") return "Novas metas: " + [p.kcal != null && `${p.kcal} kcal`, p.prot != null && `${p.prot} g de proteína`, p.fat != null && `${p.fat} g de gordura`].filter(Boolean).join(", ");
  return `${p.n} refeições por dia`;
};
