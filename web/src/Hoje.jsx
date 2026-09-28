import React, { useState } from "react";
import { Play, Droplets, Minus, ArrowRight, Check, Plus } from "lucide-react";
import { PLAN, WATER_GOAL, SUPPS, WEEK_FOCUS, DELOAD_WEEK } from "./data.js";
import { kcalOf, FOODS } from "./diet.js";
import { diffDays, weekOf, dow, mondayOf, addDays, fmtLong, num, r1, signed, dayDoneSets, targetName } from "./util.js";
import { computeInsights } from "./insights.js";
import { Lightbulb, MessageCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { Rings, MacroRing, Check2, Header } from "./ui.jsx";

export const goalWeight = (p) => r1(p.peso0 - 0.45 * (diffDays(p.start, p.target) / 7));
export const sortedMeasures = (p) => [...(p.measures || [])].sort((a, b) => a.date.localeCompare(b.date));
export const pantryReady = (pantry) => { const ids = Object.keys(pantry || {}).filter((id) => pantry[id] && FOODS[id]); return ids.some((id) => FOODS[id].cat === "prot" && !FOODS[id].pair) && ids.some((id) => FOODS[id].cat === "carb" && !FOODS[id].fixed); };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function Hero({ ctx, prog }) {
  const { profile, date, days } = ctx;
  const before = date < profile.start;
  const total = Math.max(1, diffDays(profile.start, profile.target)), used = Math.min(total, Math.max(0, diffDays(profile.start, date)));
  const left = Math.max(0, diffDays(date, profile.target)), wk = weekOf(profile.start, date), n = before ? diffDays(date, profile.start) : left;
  const ms = sortedMeasures(profile), wts = ms.filter((m) => m.peso), cs = ms.filter((m) => m.cintura);
  const lastW = wts.length ? wts[wts.length - 1].peso : profile.peso0, firstW = wts.length ? wts[0].peso : profile.peso0;
  const lastC = cs.length ? cs[cs.length - 1].cintura : null, firstC = cs.length ? cs[0].cintura : null;
  const mon = mondayOf(date), labels = ["S", "T", "Q", "Q", "S", "S", "D"];
  const applicable = prog.filter((x) => x.on), pct = applicable.length ? Math.round((applicable.reduce((a, x) => a + x.v, 0) / applicable.length) * 100) : 0;
  return (
    <section className="hero">
      <svg className="hero-v" viewBox="0 0 100 78" aria-hidden="true">
        <path d="M10 8 L50 68 L90 8" pathLength="100" fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 8 L50 68 L90 8" pathLength="100" fill="none" stroke="#FF6B2C" strokeOpacity=".55" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${Math.max(0.5, (used / total) * 100)} 200`} />
      </svg>
      <div className="hero-row">
        <Rings size={148} stroke={8} rings={prog.map((x) => ({ v: x.on ? x.v : 0, color: x.color }))}>
          <b className="num hero-pct">{pct}<small>%</small></b><span className="hero-cap">do dia</span>
        </Rings>
        <div className="hero-info">
          <div className="hero-k">{before ? "O plano começa em" : "Faltam"}</div>
          <div className="num hero-n">{n}</div>
          <div className="hero-l">{n === 1 ? "dia" : "dias"}{before ? "" : " para " + targetName(profile.target)}</div>
          <span className="hpill">Semana {wk} de 13 · {WEEK_FOCUS[wk]}</span>
        </div>
      </div>
      <div className="hero-legend">
        {prog.map((x) => (<div key={x.key} className={x.on ? "" : "off"}><i style={{ background: x.color }} /><span>{x.label}</span><b>{x.text}</b></div>))}
      </div>
      <div className="hero-week">
        {labels.map((l, i) => { const d = addDays(mon, i), day = days[d] || {}, plan = PLAN[i + 1]; const st = day.finished ? "done" : d === date ? "today" : d < date && plan ? "miss" : ""; return (<div key={d} className={"hw " + st}><small>{l}</small><span>{day.finished ? <Check size={15} strokeWidth={3.4} /> : parseInt(d.slice(8), 10)}</span></div>); })}
      </div>
      <div className="hero-stats">
        <div><b className="num">{r1(lastW).toFixed(1)}</b><small>kg · meta {goalWeight(profile).toFixed(1)}{wts.length > 1 ? ` · ${signed(lastW - firstW)}` : ""}</small></div>
        <div><b className="num">{lastC ? lastC.toFixed(1) : "-"}</b><small>cm cintura{cs.length > 1 ? ` · ${signed(lastC - firstC)}` : ""}</small></div>
      </div>
    </section>
  );
}

function Setup({ ctx }) {
  const { profile, goTab, openBuilder } = ctx;
  const items = [
    { ok: pantryReady(profile.pantry), t: "Marque o que você comprou", d: "O cardápio usa só esses alimentos", go: () => goTab("dieta", "mercado") },
    { ok: !!profile.suppDone, t: "Escolha seus suplementos", d: "Só os que você tem entram na rotina", go: () => goTab("guia", "suplementos") },
    { ok: !!profile.planSet, t: "Defina seu treino", d: "Gere um treino ou monte o seu", go: openBuilder },
  ];
  const done = items.filter((i) => i.ok).length;
  if (done === items.length) return null;
  return (
    <section className="card setup">
      <div className="row sb"><h2>Personalize seu plano</h2><span className="pill acc">{done}/3</span></div>
      <div className="setup-list">
        {items.map((it) => (
          <button key={it.t} className={"setup-row" + (it.ok ? " ok" : "")} onClick={it.go}>
            <span className="box">{it.ok && <Check size={15} strokeWidth={3.2} />}</span>
            <span className="grow"><b>{it.t}</b><small>{it.d}</small></span>{!it.ok && <ArrowRight size={18} className="mute" />}
          </button>))}
      </div>
    </section>
  );
}

function Insights({ ctx }) {
  const { profile, days, date, goal, setProfile, openCoach } = ctx;
  const list = computeInsights({ profile, days, date, goal });
  if (!list.length) return null;
  return (
    <section className="card">
      <h2><Lightbulb size={22} className="acc" />Insights</h2>
      <div className="ins-list mt">
        {list.map((i) => (
          <div key={i.id} className={"ins " + i.level}>
            <div className="ins-i">{i.level === "warn" ? <AlertTriangle size={18} /> : i.level === "ok" ? <TrendingUp size={18} /> : <Lightbulb size={18} />}</div>
            <div className="grow"><b>{i.title}</b><p className="small mute">{i.text}</p>
              {(i.action || i.ask) && <div className="row wrap mt-s">
                {i.action && <button className="btn sm" onClick={() => setProfile((p) => ({ ...p, kcal: goal.kcal + i.action.kcalDelta }))}>{i.action.label}</button>}
                {i.ask && <button className="btn soft sm" onClick={() => openCoach(i.id.startsWith("proteina") || i.id.startsWith("peso") || i.id === "agua" ? "nutri" : "personal", i.ask)}><MessageCircle size={15} />Perguntar ao coach</button>}
              </div>}
            </div>
          </div>))}
      </div>
    </section>
  );
}

export default function Hoje({ ctx }) {
  const { profile, date, days, setDay, setProfile, openSession, goTab, goal, menu } = ctx;
  const day = days[date] || {}, before = date < profile.start;
  const pd = dow(date), plan = PLAN[pd], wk = weekOf(profile.start, date), deload = !before && wk === DELOAD_WEEK;
  const meals = day.meals || {}, water = day.water || 0, supps = day.supps || {}, extra = day.extra || { p: 0, c: 0, g: 0 };
  const eaten = Object.values(meals).reduce((a, x) => (x && typeof x === "object" ? { p: a.p + x.p, c: a.c + x.c, g: a.g + x.g } : a), { p: 0, c: 0, g: 0 });
  const tot = { p: eaten.p + extra.p, c: eaten.c + extra.c, g: eaten.g + extra.g }, kcal = kcalOf(tot);
  const mealsDone = Object.values(meals).filter(Boolean).length, mealsN = menu.empty ? 5 : menu.meals.length;
  const todayW = (profile.measures || []).find((m) => m.date === date && m.peso);
  const [w, setW] = useState("");
  const saveW = () => { const v = num(w); if (!v) return; setProfile((p) => { const cur = (p.measures || []).find((m) => m.date === date); return { ...p, measures: [...(p.measures || []).filter((m) => m.date !== date), { date, peso: v, cintura: cur ? cur.cintura : null }] }; }); setW(""); };
  const ownedSupps = SUPPS.filter((s) => !s.food && (profile.supps || {})[s.id]);
  const toggleMeal = (i, m) => setDay(date, (d) => { const cur = d.meals || {}; return { ...d, meals: { ...cur, [i]: cur[i] ? false : { p: m.p, c: m.c, g: m.g } } }; });

  const doneSets = plan ? dayDoneSets(day) : 0, totalSets = plan ? Object.values(day.sets || {}).reduce((a, s) => a + s.length, 0) : 0;
  const prog = [
    { key: "t", label: "Treino", color: "var(--r-treino)", on: !!plan && !before, v: day.finished ? 1 : totalSets ? doneSets / totalSets : 0, text: !plan ? "Descanso" : day.finished ? "Feito" : totalSets ? `${doneSets}/${totalSets}` : "Pendente" },
    { key: "c", label: "Cardio", color: "var(--r-cardio)", on: !!plan && !before, v: day.cardio ? 1 : 0, text: day.cardio ? `${day.cardio} min` : plan ? "Pendente" : "Opcional" },
    { key: "d", label: "Dieta", color: "var(--r-dieta)", on: !menu.empty && !before, v: mealsN ? mealsDone / mealsN : 0, text: menu.empty ? "Sem itens" : `${mealsDone}/${mealsN}` },
    { key: "a", label: "Água", color: "var(--r-agua)", on: !before, v: Math.min(1, water / WATER_GOAL), text: `${(water / 1000).toFixed(1).replace(".", ",")} L` },
  ];

  let next;
  const nextMeal = menu.empty ? -1 : menu.meals.findIndex((_, i) => !meals[i]);
  if (before) next = { t: `O plano começa em ${diffDays(date, profile.start)} dia${diffDays(date, profile.start) > 1 ? "s" : ""}`, d: "Faça as compras no Mercado e tire as fotos do ponto zero antes de começar.", cta: "Abrir o mercado", go: () => goTab("dieta", "mercado") };
  else if (plan && !day.finished) next = { t: day.started ? `Continue: ${plan.title}` : plan.title, d: `${plan.tag ? plan.tag + ". " : ""}${menu.empty ? "" : "Coma o pré-treino 1h30 antes."}`, cta: day.started ? "Continuar treino" : "Começar treino", play: true, go: () => openSession(pd), k: "Treino de hoje" };
  else if (!day.cardio && plan) next = { t: "Falta o cardio", d: plan.cardio === "leve" ? "Caminhada leve e plana, 20 a 30 min." : "20 a 30 min, inclinação 20, velocidade 6.", cta: "Registrar cardio", go: () => document.getElementById("cardio")?.scrollIntoView({ behavior: "smooth", block: "center" }), k: "Agora" };
  else if (menu.empty) next = { t: "Marque o que você comprou", d: "Sem alimentos marcados não há cardápio. Leva 1 minuto.", cta: "Abrir o mercado", go: () => goTab("dieta", "mercado"), k: "Agora" };
  else if (nextMeal >= 0) next = { t: menu.meals[nextMeal].name, d: menu.meals[nextMeal].time, cta: "Ver cardápio", go: () => goTab("dieta", "hoje"), k: "Próxima refeição" };
  else if (water < WATER_GOAL) next = { t: "Beba água", d: `Faltam ${((WATER_GOAL - water) / 1000).toFixed(2).replace(".", ",")} L para a meta de hoje.`, cta: "+250 ml", go: () => setDay(date, (d) => ({ ...d, water: (d.water || 0) + 250 })), k: "Agora" };
  else next = { t: "Dia completo", d: "Treino, dieta e água em dia. Durma 7 a 8 horas: é aí que o músculo cresce.", cta: null, k: "Parabéns" };

  return (
    <main className="page">
      <Header kicker={cap(fmtLong(date))} title="Hoje" />
      <div className="stack">
        <Hero ctx={ctx} prog={prog} />
        <Setup ctx={ctx} />
        {deload && <div className="banner"><Check size={18} /><span><b>Semana de deload.</b> Metade das séries, mesma carga, sem ir à falha. Evita estagnar por cansaço.</span></div>}
        <section className="card now">
          <div className="eyebrow">{next.k || "Agora"}</div>
          <h2>{next.t}</h2>
          <p>{next.d}</p>
          {next.cta && <button className="btn now-btn" onClick={next.go}>{next.play ? <Play size={18} fill="currentColor" /> : null}{next.cta}{!next.play && next.cta !== "+250 ml" ? <ArrowRight size={18} /> : null}</button>}
        </section>
        <Insights ctx={ctx} />
        <div className="grid two">
          <section className="card">
            <div className="row sb"><h2>Refeições</h2><span className="pill">{mealsDone} de {mealsN}</span></div>
            <div className="mrings"><MacroRing label="Calorias" value={kcal} goal={goal.kcal} unit=" kcal" color="var(--r-treino)" /><MacroRing label="Proteína" value={tot.p} goal={goal.p} unit=" g" color="var(--r-dieta)" /><MacroRing label="Carbo" value={tot.c} goal={goal.c} unit=" g" color="var(--r-cardio)" /></div>
            {menu.empty ? (<><p className="mute mt-s">Marque na Despensa o que você comprou e o cardápio aparece aqui.</p><button className="btn mt" onClick={() => goTab("dieta", "mercado")}>Abrir o mercado<ArrowRight size={18} /></button></>) : (<div className="mt">
              {menu.meals.map((m, i) => (<Check2 key={i} on={meals[i]} onClick={() => toggleMeal(i, m)}>{m.name}<small>{m.time} · {Math.round(m.kcal)} kcal</small></Check2>))}
              <button className="link" onClick={() => goTab("dieta", "hoje")}>Ver cardápio completo</button></div>)}
          </section>
          <div className="stack">
            <div className="row-2">
              <section className="card mini">
                <div className="eyebrow ice">Água</div>
                <div className="big num">{(water / 1000).toFixed(2).replace(".", ",")}<small> L</small></div>
                <div className="track"><div className="fill" style={{ width: Math.min(100, (water / WATER_GOAL) * 100) + "%", background: "var(--r-agua)" }} /></div>
                <div className="row mt-s"><button className="btn sm" style={{ flex: 1, background: "var(--r-agua)", color: "#04202F" }} onClick={() => setDay(date, (d) => ({ ...d, water: (d.water || 0) + 250 }))}><Plus size={16} />250</button>
                  <button className="btn sm soft icon" aria-label="Tirar 250 ml" style={{ width: 44, flex: "0 0 44px", minHeight: 44 }} onClick={() => setDay(date, (d) => ({ ...d, water: Math.max(0, (d.water || 0) - 250) }))}><Minus size={16} /></button></div>
              </section>
              <section className="card mini" id="cardio">
                <div className="eyebrow amber">Cardio</div>
                <p className="small mute">{!plan ? "Opcional hoje." : plan.cardio === "leve" ? "Leve e plano." : "Inclinação 20, vel. 6."}</p>
                <div className="chips mt-s">{[20, 25, 30].map((m) => <button key={m} className={"chip" + (day.cardio === m ? " on" : "")} onClick={() => setDay(date, (d) => ({ ...d, cardio: d.cardio === m ? 0 : m }))}>{m}′</button>)}</div>
              </section>
            </div>
            <section className="card">
              <h2>Suplementos</h2>
              {ownedSupps.length ? <div className="chips mt">{ownedSupps.map((s) => <button key={s.id} className={"chip lg" + (supps[s.id] ? " on" : "")} onClick={() => setDay(date, (d) => ({ ...d, supps: { ...(d.supps || {}), [s.id]: !(d.supps || {})[s.id] } }))}>{supps[s.id] && <Check size={15} strokeWidth={3.2} />}{s.name.split(" ")[0]}</button>)}</div>
                : <><p className="mute mt-s">{profile.suppDone ? "Nenhum suplemento marcado. Tudo bem: dieta e treino fazem o principal." : "Marque os suplementos que você comprou para montar sua rotina."}</p><button className="link" onClick={() => goTab("guia", "suplementos")}>Escolher suplementos</button></>}
            </section>
            <section className="card form">
              <h2>Peso de hoje</h2>
              <p className="mute mt-s small">{todayW ? <>Registrado: <b>{todayW.peso.toFixed(1).replace(".", ",")} kg</b>. Pese-se em jejum, 3 vezes por semana.</> : "Em jejum, depois de ir ao banheiro. A tendência da semana importa mais que o dia."}</p>
              <div className="inline mt"><input inputMode="decimal" aria-label="Peso em kg" placeholder="kg" value={w} onChange={(e) => setW(e.target.value)} /><button className="btn soft" onClick={saveW}>Salvar</button></div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
