import React, { useState, useMemo } from "react";
import { Play, ChevronLeft, ChevronRight, Plus, Minus, Check, Trophy, Info, Sparkles, SlidersHorizontal, Lightbulb } from "lucide-react";
import { PLAN, EX, GROUPS, DELOAD_WEEK, MUSCLE_NAME } from "./data.js";
import { weekOf, addDays, mondayOf, fmtDM, num, mmss, e1rm, lastSession, suggest, planMuscles, dayMinutes, weeklySets, sessionVolume, dayDoneSets } from "./util.js";
import BodyMap from "./bodymap.jsx";
import { Tap, Header } from "./ui.jsx";
import { MachineArt, MACHINES } from "./machines.jsx";
import { DEFAULT_PLAN, clonePlan } from "./plan.js";
import { modeName } from "./Builder.jsx";

export const TEMPO = {
  comp: { n: "2-1-1", t: "Desça em 2 segundos, faça 1 segundo de pausa no ponto de maior alongamento e suba com força em 1 segundo. Expire na subida (esforço) e inspire na descida." },
  iso: { n: "2-0-1", t: "Desça em 2 segundos, suba em 1 segundo e aperte o músculo por 1 segundo no topo. Expire ao contrair, inspire ao voltar." },
  time: { n: "firme", t: "Mantenha a posição sem prender a respiração. Respire de forma curta e constante." },
};
const groupsOf = (ids) => { const c = {}; ids.forEach((id) => EX[id].pri.forEach((m) => { const g = (GROUPS.find(([, ms]) => ms.includes(m)) || [])[0]; if (g) c[g] = (c[g] || 0) + EX[id].sets; })); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]); };

export function TreinoHome({ ctx }) {
  const { profile, date, days, openSession } = ctx;
  const start = date < profile.start ? profile.start : date;
  const wk = weekOf(profile.start, start), deload = wk === DELOAD_WEEK, mon = mondayOf(start);
  const ws = weeklySets(), maxS = Math.max(1, ...Object.values(ws));
  return (
    <main className="page">
      <Header kicker={`Semana ${wk} de 13`} title="Treino" sub={deload ? "Deload: metade das séries, mesma carga." : "Suba a carga ou as repetições toda semana."} />
      <div className="stack">
        <section className="card flat modecard">
          <div className="grow"><div className="eyebrow">Seu treino</div><b className="modename">{modeName[(profile.plan || {}).mode] || "Padrão"}</b><p className="small mute">{Object.keys(PLAN).length} dias por semana</p></div>
          <button className="btn sm" onClick={ctx.openBuilder}><SlidersHorizontal size={16} />Personalizar</button>
        </section>
        <div className="grid two">
          {Object.entries(PLAN).map(([k, p]) => {
            const n = Number(k), d = addDays(mon, n - 1), day = days[d] || {}, mm = planMuscles(p.ex), today = d === date;
            return (
              <Tap key={k} className={"daycard" + (today ? " today" : "") + (day.finished ? " fin" : "")} onClick={() => openSession(n)}>
                <div className="dc-map"><BodyMap primary={mm.pri} secondary={mm.sec} compact /></div>
                <div className="dc-body">
                  <div className="row sb"><span className="pill">{p.short} · {fmtDM(d)}</span>{day.finished ? <span className="pill ok"><Check size={12} strokeWidth={3.4} />Feito</span> : today ? <span className="pill acc">Hoje</span> : null}</div>
                  <div className="dc-title">{p.title}</div>
                  <p className="small mute">{p.ex.length} exercícios · cerca de {dayMinutes(p.ex)} min</p>
                  <div className="chips mt-s">{groupsOf(p.ex).map((g) => <span key={g} className="chip xs">{g}</span>)}</div>
                </div>
                <ChevronRight size={20} className="dc-go" />
              </Tap>
            );
          })}
        </div>
        <section className="card">
          <h2>Séries por semana</h2>
          <p className="small mute mt-s">É o volume que constrói o V: costas e ombros recebem mais séries, e o abdômen só o necessário.</p>
          <div className="mt">{GROUPS.map(([g]) => (<div key={g} className="bar"><div className="bar-top"><span>{g}</span><b className="num">{ws[g]}</b></div><div className="track"><div className="fill" style={{ width: (ws[g] / maxS) * 100 + "%" }} /></div></div>))}</div>
        </section>
        <section className="card flat vbox">
          <h2><Sparkles size={20} className="acc" />Como o V é construído</h2>
          <ol className="steps">
            <li><b>Largura de cima.</b> Dorsal (puxadas, pullover) e ombro lateral (elevações, 2x por semana) alargam os ombros.</li>
            <li><b>Cintura menor.</b> Vem do déficit calórico. Por isso a dieta pesa tanto quanto o treino.</li>
            <li><b>Peito alto.</b> Supinos inclinados fecham a linha do peito com o ombro.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}

function SetRow({ ex, i, st, sug, upd, onToggle }) {
  const timed = ex.kind === "time", noKg = timed || ex.bw;
  return (
    <div className={"set" + (st.done ? " done" : "") + (noKg ? " nokg" : "")}>
      <span className="num sn">{i + 1}</span>
      {!noKg && <label className="sfield"><input aria-label={`Carga da série ${i + 1}, em quilos`} inputMode="decimal" value={st.kg} placeholder="0" onChange={(e) => upd({ kg: e.target.value })} /><small>kg</small></label>}
      <label className="sfield"><input aria-label={`${timed ? "Segundos" : "Repetições"} da série ${i + 1}`} inputMode="numeric" value={st.reps} placeholder={String(sug.reps)} onChange={(e) => upd({ reps: e.target.value })} /><small>{timed ? "seg" : "reps"}</small></label>
      <button className={"tick" + (st.done ? " on" : "")} aria-label={st.done ? "Desmarcar série" : "Concluir série"} onClick={onToggle}><Check size={24} strokeWidth={3.2} /></button>
    </div>
  );
}

export function Session({ ctx, planDay, onExit }) {
  const { profile, date, days, setDay, setProfile, startRest, setRest, rest } = ctx;
  const plan = PLAN[planDay], day = days[date] || {}, wk = weekOf(profile.start, date), deload = wk === DELOAD_WEEK && date >= profile.start;
  const n = plan.ex.length, started = day.started && day.plan === planDay;
  const [step, setStep] = useState(day.finished && started ? n : -1);
  const [cue, setCue] = useState(false);
  const setRestFor = (id, sec) => setProfile((p) => { const pl = clonePlan(p.plan); pl.over = pl.over || {}; pl.over[id] = { ...(pl.over[id] || {}), rest: sec }; return { ...p, plan: pl }; });
  const sug = useMemo(() => Object.fromEntries(plan.ex.map((id) => [id, suggest(EX[id], lastSession(days, id, date), deload)])), [days, date, planDay, deload]);
  const mm = planMuscles(plan.ex);

  const start = () => {
    setDay(date, (d) => {
      const sets = { ...(d.sets || {}) };
      plan.ex.forEach((id) => { const ex = EX[id], s = sug[id], cnt = deload ? Math.max(1, Math.ceil(ex.sets / 2)) : ex.sets; if (!sets[id]) sets[id] = Array.from({ length: cnt }, () => ({ kg: s.kg ? String(s.kg) : "", reps: "", done: false })); });
      return { ...d, started: true, plan: planDay, startedAt: d.startedAt || Date.now(), sets, finished: false };
    });
    setStep(0);
  };
  const upd = (id, i, patch) => setDay(date, (d) => ({ ...d, sets: { ...d.sets, [id]: d.sets[id].map((s, j) => (j === i ? { ...s, ...patch } : s)) } }));
  const toggle = (id, i) => {
    const s = day.sets[id][i], ex = EX[id];
    if (!s.done) { upd(id, i, { done: true, reps: s.reps || String(sug[id].reps) }); startRest(ex.rest, `Descanso · ${ex.name}`); } else upd(id, i, { done: false });
  };
  const addSet = (id) => setDay(date, (d) => { const a = d.sets[id], l = a[a.length - 1] || { kg: "" }; return { ...d, sets: { ...d.sets, [id]: [...a, { kg: l.kg, reps: "", done: false }] } }; });
  const rmSet = (id) => setDay(date, (d) => ({ ...d, sets: { ...d.sets, [id]: d.sets[id].slice(0, -1) } }));
  const adjust = (id, delta) => setDay(date, (d) => ({ ...d, sets: { ...d.sets, [id]: d.sets[id].map((s) => (s.done ? s : { ...s, kg: String(Math.max(0, Math.round((num(s.kg) + delta) * 100) / 100)) })) } }));
  const finish = () => { setDay(date, (d) => ({ ...d, finished: true, finishedAt: Date.now() })); setRest(null); setStep(n); };
  const go = (s) => { setStep(s); setCue(false); window.scrollTo(0, 0); };
  const back = <button className="back" onClick={() => { setRest(null); onExit(); }}><ChevronLeft size={20} />Treinos</button>;

  if (step === -1) return (
    <main className="page">
      {back}
      <Header kicker={`${plan.short} · ${plan.tag || "Treino"}${deload ? " · Deload" : ""}`} title={plan.title} sub={`${n} exercícios · cerca de ${dayMinutes(plan.ex)} min`} />
      <div className="stack">
        <section className="card flat center"><BodyMap primary={mm.pri} secondary={mm.sec} /><p className="legend"><i className="k pri" />Principal <i className="k sec" />Auxiliar</p></section>
        <div className="banner info"><Info size={18} /><span>Aquecimento: 1 a 2 séries leves antes da primeira série de trabalho do primeiro exercício de cada grupo.</span></div>
        <section className="card">
          {plan.ex.map((id, i) => {
            const ex = EX[id], s = sug[id], cnt = deload ? Math.max(1, Math.ceil(ex.sets / 2)) : ex.sets;
            return (
              <div key={id} className="exrow">
                <span className="num idx">{i + 1}</span>
                <div className="grow">
                  <div className="ex-name">{ex.name}</div>
                  <div className="small mute">{cnt} × {ex.kind === "time" ? ex.reps[0] + " s" : ex.reps[0] === ex.reps[1] ? ex.reps[0] : ex.reps[0] + " a " + ex.reps[1]}{ex.rir ? ` · RIR ${ex.rir}` : ""} · descanso {mmss(ex.rest)}</div>
                  <div className="chips mt-s">{ex.pri.map((m) => <span key={m} className="chip xs">{MUSCLE_NAME[m]}</span>)}{s.kg ? <span className={"chip xs" + (s.up ? " on" : "")}>{s.up ? `Subir para ${s.kg} kg` : `Meta ${s.kg} kg`}</span> : null}</div>
                </div>
                {ex.mach && <MachineArt id={ex.mach} className="exthumb" />}
              </div>);
          })}
        </section>
      </div>
      <div className="bottombar"><button className="btn" onClick={started ? () => go(Math.max(0, plan.ex.findIndex((id) => (day.sets?.[id] || []).some((x) => !x.done)))) : start}><Play size={18} fill="currentColor" />{started ? "Continuar treino" : "Começar treino"}</button></div>
    </main>
  );

  if (step >= n) {
    const vol = sessionVolume(day), sets = dayDoneSets(day), mins = day.startedAt && day.finishedAt ? Math.round((day.finishedAt - day.startedAt) / 60000) : null;
    const prs = plan.ex.map((id) => {
      const today = (day.sets?.[id] || []).filter((s) => s.done && num(s.kg) > 0); if (!today.length) return null;
      const best = Math.max(...today.map((s) => e1rm(num(s.kg), num(s.reps)))); let prev = 0;
      Object.keys(days).filter((d) => d < date).forEach((d) => (days[d].sets?.[id] || []).filter((s) => s.done).forEach((s) => { prev = Math.max(prev, e1rm(num(s.kg), num(s.reps))); }));
      return prev > 0 && best > prev + 0.01 ? EX[id].name : null;
    }).filter(Boolean);
    return (
      <main className="page">
        <Header kicker={plan.title} title="Treino concluído" />
        <div className="stack">
          <div className="stats"><div className="stat"><b className="num">{sets}</b><small>séries</small></div><div className="stat"><b className="num">{Math.round(vol).toLocaleString("pt-BR")}</b><small>kg de volume</small></div><div className="stat"><b className="num">{mins ?? "-"}</b><small>minutos</small></div></div>
          {prs.length > 0 && <section className="card"><h2><Trophy size={22} className="acc" />Novos recordes</h2><div className="mt">{prs.map((p) => <p key={p} className="prline">{p}</p>)}</div></section>}
          <section className="card flat"><h2>Falta o cardio</h2><p className="mute mt-s">{plan.cardio === "leve" ? "Caminhada leve e plana, 20 a 30 min." : "20 a 30 min, inclinação 20, velocidade 6."} Registre na tela Hoje.</p></section>
          <button className="btn" onClick={onExit}>Voltar</button>
          <button className="btn soft" onClick={() => go(0)}>Revisar exercícios</button>
        </div>
      </main>
    );
  }

  const id = plan.ex[step], ex = EX[id], s = sug[id], sets = day.sets?.[id] || [];
  const timed = ex.kind === "time", noKg = timed || ex.bw, curKg = sets.find((x) => !x.done)?.kg, mach = ex.mach ? MACHINES[ex.mach] : null;
  return (
    <main className="page session">
      <div className="row sb"><button className="back" onClick={() => go(-1)}><ChevronLeft size={20} />Resumo</button><span className="pill">Exercício {step + 1} de {n}</span></div>
      <div className="segs">{plan.ex.map((x, i) => { const ss = day.sets?.[x] || [], done = ss.length > 0 && ss.every((y) => y.done); return <button key={x} aria-label={`Ir para ${EX[x].name}`} className={"sg" + (i === step ? " cur" : "") + (done ? " ok" : "")} onClick={() => go(i)} />; })}</div>
      <h1 className="title ex-title">{ex.name}</h1>
      {mach ? (
        <div className="exvis">
          <div className="artcard"><MachineArt id={ex.mach} /><span className={"where" + (ex.rare ? " rare" : "")}>{ex.rare ? (ex.rareLabel || "Nem toda academia tem") : mach.where}</span></div>
          <div className="exmap"><BodyMap primary={ex.pri} secondary={ex.sec} compact /></div>
        </div>
      ) : (
        <div className="exvis one"><div className="exmap"><BodyMap primary={ex.pri} secondary={ex.sec} compact /></div><div className="exinfo"><span className={"where solo" + (ex.rare ? " rare" : "")}>{ex.eq === "livre" ? "Halteres / barra" : ex.eq === "peso" ? "Peso do corpo" : ex.rare ? (ex.rareLabel || "Nem toda academia tem") : "Máquina"}</span></div></div>
      )}
      <div className="exmeta">
        {mach && <p className="machname"><b>{mach.name}</b></p>}
        <p className="mute">{ex.effect}</p>
        <div className="legend2"><span><i className="k pri" />{ex.pri.map((m) => MUSCLE_NAME[m]).join(", ")}</span>{ex.sec.length ? <span><i className="k sec" />{ex.sec.map((m) => MUSCLE_NAME[m]).join(", ")}</span> : null}</div>
      </div>
      <div className="specs">
        <div><b className="num">{sets.length || ex.sets}</b><small>séries</small></div>
        <div><b className="num">{timed ? ex.reps[0] + "s" : ex.reps[0] === ex.reps[1] ? ex.reps[0] : ex.reps[0] + "–" + ex.reps[1]}</b><small>{timed ? "por série" : "repetições"}</small></div>
        <div><b className="num">{ex.rir || "-"}</b><small>RIR</small></div>
        <div><b className="num">{mmss(ex.rest)}</b><small>descanso</small></div>
      </div>
      <p className="small mute cad">Cadência {TEMPO[ex.kind]?.n || "livre"}. RIR é quantas repetições sobram no tanque ao terminar a série{ex.kind === "iso" ? "; na última série você pode chegar a RIR 0 a 1" : ""}.</p>
      <div className={"sugg" + (s.up ? " up" : "")}><Lightbulb size={18} /><span>{s.text}</span></div>
      <div className="row wrap"><button className="link" onClick={() => setCue(!cue)}>{cue ? "Esconder passo a passo" : "Ver passo a passo e ajustes do aparelho"}</button><button className="link" onClick={() => ctx.openCoach("personal", `Sobre o exercício ${ex.name}: `)}>Perguntar ao personal</button></div>
      {cue && (<div className="howto">
        {mach && <div><h3>Ajuste do aparelho</h3><ul>{mach.setup.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
        <div><h3>Execução</h3><ul>{ex.cues.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
        {mach && <div><h3>Erro comum</h3><p>{mach.mistake}</p></div>}
        <div><h3>Respiração e cadência</h3><p>{TEMPO[ex.kind]?.t}</p></div>
      </div>)}
      {!noKg && sets.some((x) => !x.done) && (
        <div className="loadadj"><span className="small mute">Ajustar carga das séries restantes</span>
          <div className="row"><button className="btn soft sm" aria-label={`Diminuir ${ex.inc} kg`} onClick={() => adjust(id, -ex.inc)}><Minus size={16} />{ex.inc}</button><b className="num">{curKg || 0} kg</b><button className="btn soft sm" aria-label={`Aumentar ${ex.inc} kg`} onClick={() => adjust(id, ex.inc)}><Plus size={16} />{ex.inc}</button></div></div>)}
      <div className="sets">{sets.map((st, i) => <SetRow key={i} ex={ex} i={i} st={st} sug={s} upd={(p) => upd(id, i, p)} onToggle={() => toggle(id, i)} />)}</div>
      <div className="row mt"><button className="btn soft sm" onClick={() => addSet(id)}><Plus size={16} />Série</button>{sets.length > 1 && <button className="btn soft sm" onClick={() => rmSet(id)}><Minus size={16} />Série</button>}</div>
      <div className="restpick"><span className="small mute">Descanso entre séries</span>
        <div className="chips">{[45, 60, 90, 120, 150, 180].map((sec) => <button key={sec} className={"chip sel" + (ex.rest === sec ? " on" : "")} aria-pressed={ex.rest === sec} onClick={() => setRestFor(id, sec)}>{mmss(sec)}</button>)}</div>
        <p className="small mute">{ctx.autoRest ? "O cronômetro inicia sozinho ao concluir a série." : "Cronômetro automático desligado (Guia > Ajustes)."}</p></div>
      <div className={"bottombar" + (rest ? " with-rest" : "")}>
        {step > 0 && <button className="btn soft icon" aria-label="Exercício anterior" onClick={() => go(step - 1)}><ChevronLeft size={22} /></button>}
        {step < n - 1 ? <button className="btn" onClick={() => go(step + 1)}>Próximo exercício<ChevronRight size={18} /></button> : <button className="btn" onClick={finish}>Finalizar treino</button>}
      </div>
    </main>
  );
}
