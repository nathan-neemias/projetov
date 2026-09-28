import { PLAN, EX, WATER_GOAL } from "./data.js";
import { e1rm, num, addDays, mondayOf, diffDays, r1 } from "./util.js";

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

/** Motor de regras: lê treinos, medidas e dieta e devolve alertas e sugestões acionáveis. */
export function computeInsights({ profile, days, date, goal }) {
  const out = [], before = date < profile.start;
  const push = (i) => out.push(i);
  const ms = [...(profile.measures || [])].sort((a, b) => a.date.localeCompare(b.date));
  const w = ms.filter((m) => m.peso), c = ms.filter((m) => m.cintura);
  const inR = (a, b) => w.filter((m) => m.date > addDays(date, -a) && m.date <= addDays(date, -b)).map((m) => m.peso);

  // 1. Tendência do peso
  const A = inR(7, 0), B = inR(14, 7);
  if (!before && A.length >= 2 && B.length >= 2) {
    const d = avg(A) - avg(B);
    if (d > -0.15) push({ id: "peso-parado", level: "warn", title: "Peso parado", text: `A média da semana ${d > 0.15 ? "subiu" : "ficou parada"} (${d > 0 ? "+" : ""}${r1(d)} kg). Se repetir por 2 semanas, tire 150 a 200 kcal de carboidrato.`, action: goal.kcal - 150 >= 1800 ? { label: "Reduzir 150 kcal", kcalDelta: -150 } : null, ask: "Meu peso parou, o que devo ajustar?" });
    else if (d < -0.8) push({ id: "peso-rapido", level: "warn", title: "Perdendo rápido demais", text: `${r1(d)} kg na semana. Somar cerca de 150 kcal protege músculo e força.`, action: { label: "Somar 150 kcal", kcalDelta: 150 }, ask: "Estou emagrecendo rápido demais, ajuste minha dieta." });
    else push({ id: "peso-ok", level: "ok", title: "Peso no ritmo", text: `${r1(d)} kg na semana. Não mexa em nada.` });
  }
  if (!before && (!w.length || diffDays(w[w.length - 1].date, date) >= 6)) push({ id: "sem-peso", level: "info", title: "Faça a pesagem", text: w.length ? `Sem peso registrado há ${diffDays(w[w.length - 1].date, date)} dias. Pese-se em jejum 3 vezes por semana.` : "Registre seu peso em jejum para eu analisar a tendência." });
  if (!before && (!c.length || diffDays(c[c.length - 1].date, date) >= 14)) push({ id: "sem-cintura", level: "info", title: "Meça a cintura", text: "Cintura no umbigo a cada 2 semanas mostra o que a balança esconde." });

  // 2. Evolução de carga por exercício
  const sess = {};
  Object.keys(days).sort().forEach((d) => Object.entries(days[d].sets || {}).forEach(([id, arr]) => {
    const done = arr.filter((s) => s.done && num(s.kg) > 0 && num(s.reps) > 0); if (!done.length || !EX[id]) return;
    (sess[id] = sess[id] || []).push(Math.max(...done.map((s) => e1rm(num(s.kg), num(s.reps)))));
  }));
  const stuck = [], up = [], drop = [];
  Object.entries(sess).forEach(([id, v]) => {
    if (v.length >= 4) { const last3 = Math.max(...v.slice(-3)), before3 = Math.max(...v.slice(0, -3)); if (last3 <= before3 * 1.01) stuck.push(id); }
    if (v.length >= 2 && v[v.length - 1] >= v[v.length - 2] * 1.02) up.push(id);
    if (v.length >= 3 && v[v.length - 1] < Math.max(...v.slice(-4, -1)) * 0.92) drop.push(id);
  });
  stuck.slice(0, 2).forEach((id) => push({ id: "estagnado-" + id, level: "warn", title: `Estagnado: ${EX[id].name}`, text: "Sem ganho de carga em 3 treinos. Aumente o descanso em 30 a 60 s, confira o sono ou troque por uma variação.", ask: `Estou estagnado em ${EX[id].name}. O que faço?` }));
  if (drop.length >= 3) push({ id: "fadiga", level: "warn", title: "Sinais de fadiga acumulada", text: `A força caiu em ${drop.length} exercícios no último treino. Considere uma semana de deload (metade das séries, mesma carga) e cheque sono e calorias.`, ask: "Estou cansado e a força caiu. Preciso de deload?" });
  if (up.length) push({ id: "evoluindo", level: "ok", title: "Evoluindo", text: `Mais força em ${up.slice(0, 3).map((id) => EX[id].name).join(", ")}.` });

  // 3. Aderência à semana
  if (!before) {
    const mon = mondayOf(date); let planned = 0, done = 0;
    for (let i = 0; i < 7; i++) { const d = addDays(mon, i); if (d >= date) break; if (PLAN[i + 1]) { planned++; if (days[d]?.finished) done++; } }
    if (planned - done >= 2) push({ id: "faltou-treino", level: "warn", title: "Treinos em atraso", text: `${done} de ${planned} treinos feitos até ontem. Não compense em dobro: retome o treino do dia e mantenha a semana.`, ask: "Perdi treinos esta semana, como reorganizo?" });
    let cd = 0; for (let i = 0; i < 7; i++) if (days[addDays(date, -i)]?.cardio) cd++;
    if (Object.keys(PLAN).length && cd < 3 && diffDays(profile.start, date) >= 7) push({ id: "cardio", level: "info", title: "Cardio abaixo do plano", text: `${cd} sessões nos últimos 7 dias. Prefira somar passos se a recuperação estiver curta.` });
  }

  // 4. Dieta: proteína e água
  const prot = [];
  for (let i = 1; i <= 7; i++) { const d = days[addDays(date, -i)]; if (!d) continue; const meals = Object.values(d.meals || {}).filter((x) => x && typeof x === "object"); if (meals.length >= 2) prot.push(meals.reduce((a, x) => a + x.p, 0) + ((d.extra || {}).p || 0)); }
  if (prot.length >= 3) { const a = avg(prot); if (a < goal.p * 0.85) push({ id: "proteina", level: "warn", title: "Proteína abaixo da meta", text: `Média de ${Math.round(a)} g contra meta de ${goal.p} g. Marque mais fontes no Mercado ou some um whey ou iogurte.`, ask: "Estou abaixo da meta de proteína. Como fecho?" }); }
  const wat = []; for (let i = 1; i <= 5; i++) { const d = days[addDays(date, -i)]; if (d && d.water) wat.push(d.water); }
  if (wat.length >= 3 && avg(wat) < WATER_GOAL * 0.7) push({ id: "agua", level: "info", title: "Água abaixo da meta", text: `Média de ${(avg(wat) / 1000).toFixed(1).replace(".", ",")} L. Deixe uma garrafa de 2 L marcada à vista.` });

  const rank = { warn: 0, info: 1, ok: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]).slice(0, 6);
}
export const insightsText = (list) => (list.length ? list.map((i) => `- [${i.level}] ${i.title}: ${i.text}`).join("\n") : "nenhum alerta");
