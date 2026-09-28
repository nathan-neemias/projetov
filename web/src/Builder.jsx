import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronDown, Plus, X, ArrowUp, ArrowDown, Wand2, Lightbulb } from "lucide-react";
import { LIB, EQ_NAME } from "../../shared/lib.js";
import { GROUPS, MUSCLE_NAME } from "./data.js";
import { generatePlan, parseWorkout, analyzePlan, placeDay, sortCompoundsFirst, exDef, autoTitle, DEFAULT_PLAN, SHORT, TARGETS, norm } from "./plan.js";
import { Seg, Header, Sheet } from "./ui.jsx";

const clone = (o) => JSON.parse(JSON.stringify(o));
const mins = (e) => Math.round((e.sets * (45 + e.rest)) / 60);
const dayMins = (plan, d) => d.ex.reduce((a, id) => { const e = exDef(plan, id); return a + (e ? mins(e) : 0); }, 0);
const sortedDays = (plan) => Object.entries(plan.days).sort((a, b) => a[0] - b[0]);
const modeName = { padrao: "Padrão", gerado: "Gerado pelo app", custom: "Personalizado" };
export { modeName };

function Choice({ value, onChange, options }) {
  return <div className="chips">{options.map(([k, l]) => <button key={k} className={"chip lg sel" + (value === k ? " on" : "")} aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}</div>;
}

function Preview({ plan, equip, common = true }) {
  const an = useMemo(() => analyzePlan(plan, equip, common), [plan, equip, common]);
  return (<>
    {sortedDays(plan).map(([n, d]) => (
      <section key={n} className="card pv">
        <div className="row"><span className="dchip num">{SHORT[n - 1]}</span><div className="grow"><h2>{d.title}</h2><p className="small mute">{d.ex.length} exercícios · cerca de {Math.round(dayMins(plan, d))} min</p></div></div>
        <p className="small mute mt-s">{d.ex.map((id) => exDef(plan, id)?.name).filter(Boolean).join(" · ")}</p>
      </section>))}
    <section className="card"><h2>Séries por semana</h2><div className="mt"></div>
      {GROUPS.map(([g]) => { const [lo, hi] = TARGETS[g], v = an.sets[g], ok = v >= lo && v <= hi + 2; return (
        <div key={g} className="bar"><div className="bar-top"><span>{g} <small className="mute">ideal {lo} a {hi}</small></span><b className="num">{v}</b></div><div className="track"><div className={"fill" + (ok ? "" : " warn")} style={{ width: Math.min(100, (v / (hi + 4)) * 100) + "%" }} /></div></div>); })}
    </section>
  </>);
}

function Picker({ plan, day, onAdd, onCreate, onClose, commonDefault = true }) {
  const [common, setCommon] = useState(commonDefault);
  const [q, setQ] = useState(""), [grp, setGrp] = useState("Todos"), [eq, setEq] = useState("todos");
  const [nw, setNw] = useState({ name: "", m: "chest", eq: "maq" });
  const list = LIB.filter((e) => (!common || !e.rare) && (grp === "Todos" || e.pri.some((m) => GROUPS.find(([g]) => g === grp)[1].includes(m))) && (eq === "todos" || e.eq === eq) && (!q || norm(e.name + " " + e.alias.join(" ")).includes(norm(q)))).slice(0, 40);
  const inDay = plan.days[day].ex;
  return (
    <Sheet open onClose={onClose} title={`Adicionar em ${SHORT[day - 1]}`}>
      <input className="field search" placeholder="Buscar (ex.: supino, rosca, leg)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips tight">{["Todos", ...GROUPS.map(([g]) => g)].map((g) => <button key={g} className={"chip sel" + (grp === g ? " on" : "")} onClick={() => setGrp(g)}>{g}</button>)}</div>
      <div className="chips tight"><button className={"chip sel" + (common ? " on" : "")} aria-pressed={common} onClick={() => setCommon(!common)}>Só comuns</button></div>
      <div className="chips tight">{[["todos", "Todos"], ...Object.entries(EQ_NAME)].map(([k, l]) => <button key={k} className={"chip sel" + (eq === k ? " on" : "")} onClick={() => setEq(k)}>{l}</button>)}</div>
      <div className="plist">
        {list.map((e) => (<button key={e.id} className="prow2" disabled={inDay.includes(e.id)} onClick={() => onAdd(e.id)}><span className="grow"><b>{e.name}</b><small>{e.pri.map((m) => MUSCLE_NAME[m]).join(", ")} · {EQ_NAME[e.eq]}{e.rare ? " · " + (e.rareLabel ? "pouco usado" : "nem toda academia") : ""}</small></span>{inDay.includes(e.id) ? <span className="pill">No dia</span> : <Plus size={20} className="acc" />}</button>))}
        {!list.length && <p className="empty">Nada encontrado. Crie o seu abaixo.</p>}
      </div>
      <div className="form newex">
        <h2>Criar exercício próprio</h2>
        <label className="mt-s">Nome<input value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} placeholder="Ex.: Supino na máquina Hammer" /></label>
        <div className="row-2"><label>Músculo principal<select value={nw.m} onChange={(e) => setNw({ ...nw, m: e.target.value })}>{Object.entries(MUSCLE_NAME).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label>Equipamento<select value={nw.eq} onChange={(e) => setNw({ ...nw, eq: e.target.value })}>{Object.entries(EQ_NAME).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label></div>
        <button className="btn soft" onClick={() => { if (nw.name.trim()) { onCreate(nw); setNw({ ...nw, name: "" }); } }}>Criar e adicionar</button>
      </div>
    </Sheet>
  );
}

export default function Builder({ ctx, onClose }) {
  const { profile, setProfile } = ctx;
  const cur = profile.plan || DEFAULT_PLAN;
  const [tab, setTab] = useState(profile.planSet ? "montar" : "gerar");
  const [o, setO] = useState({ days: 5, focus: "v", equip: "maquina", minutes: 75, variant: 0, common: profile.onlyCommon !== false, ...(cur.opts || {}) });
  const preview = useMemo(() => generatePlan(o), [o]);
  const [draft, setDraft] = useState(() => clone(cur));
  const [openDay, setOpenDay] = useState(null), [picker, setPicker] = useState(null), [txt, setTxt] = useState(""), [result, setResult] = useState(null), [err, setErr] = useState("");
  const [eqPref, setEqPref] = useState(o.equip || "maquina");
  const an = useMemo(() => analyzePlan(draft, eqPref, o.common), [draft, eqPref, o.common]);

  const upd = (fn) => setDraft((d) => { const n = clone(d); fn(n); n.mode = "custom"; return n; });
  const retitle = (n, d) => { if (d.auto !== false) d.title = autoTitle(d.ex, (id) => exDef(n, id)); };
  const toggleDay = (n) => upd((d) => { if (d.days[n]) delete d.days[n]; else d.days[n] = { title: "Novo treino", ex: [], style: "" }; });
  const addEx = (n, id) => upd((d) => { const day = d.days[n]; if (!day.ex.includes(id)) day.ex.push(id); retitle(d, day); });
  const rmEx = (n, id) => upd((d) => { const day = d.days[n]; day.ex = day.ex.filter((x) => x !== id); retitle(d, day); });
  const move = (n, i, dir) => upd((d) => { const a = d.days[n].ex, j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; });
  const setOver = (id, patch) => upd((d) => { d.over[id] = { ...(d.over[id] || {}), ...patch }; });
  const create = (n, nw) => upd((d) => { const id = "c_" + Date.now().toString(36); d.custom[id] = { name: nw.name.trim(), pri: [nw.m], sec: [], eq: nw.eq, kind: "iso", sets: 3, reps: [8, 12], rest: 90, inc: 2.5, effect: "Exercício personalizado.", cues: [] }; d.days[n].ex.push(id); retitle(d, d.days[n]); });
  const suggestedAdd = (tip, id) => { const n = placeDay(draft, tip.muscle); if (n) addEx(n, id); };

  const canSave = Object.values(draft.days).some((d) => d.ex.length);
  const save = (plan) => { setProfile((p) => ({ ...p, plan, planSet: true, onlyCommon: o.common })); onClose(); };
  const interpret = () => {
    setErr(""); const r = parseWorkout(txt, eqPref);
    if (!Object.keys(r.days).length) { setErr("Não consegui identificar exercícios. Escreva um dia por linha, por exemplo: Segunda: supino inclinado, crucifixo, tríceps corda."); return; }
    setDraft({ mode: "custom", days: r.days, over: r.over, custom: r.custom }); setResult({ matched: r.matched, unmatched: r.unmatched }); setTab("montar");
  };

  return (
    <main className="page">
      <button className="back" onClick={onClose}><ChevronLeft size={20} />Treinos</button>
      <Header kicker={`Treino atual: ${modeName[cur.mode] || "Padrão"}`} title="Personalizar" sub="Gere um treino, monte o seu ou cole o que você já tem." />
      <Seg value={tab} onChange={setTab} options={[["gerar", "Gerar"], ["montar", "Montar"], ["colar", "Colar"]]} />

      {tab === "gerar" && (<>
        <section className="card form">
          <h2>Suas preferências</h2>
          <label className="gap">Dias por semana</label><Choice value={o.days} onChange={(v) => setO({ ...o, days: v, variant: 0 })} options={[[3, "3"], [4, "4"], [5, "5"], [6, "6"]]} />
          <label className="gap">Foco</label><Choice value={o.focus} onChange={(v) => setO({ ...o, focus: v })} options={[["v", "Formato em V"], ["eq", "Equilibrado"], ["pb", "Peito e braços"]]} />
          <label className="gap">Equipamento</label><Choice value={o.equip} onChange={(v) => { setO({ ...o, equip: v }); setEqPref(v); }} options={[["maquina", "Máquinas e polias"], ["misto", "Misto"], ["livre", "Halteres e barras"]]} />
          <label className="gap">Aparelhos</label><Choice value={o.common ? "1" : "0"} onChange={(v) => setO({ ...o, common: v === "1" })} options={[["1", "Só os que toda academia tem"], ["0", "Todos"]]} />
          <label className="gap">Tempo por treino</label><Choice value={o.minutes} onChange={(v) => setO({ ...o, minutes: v })} options={[[45, "45 min"], [60, "60 min"], [75, "75 min"], [90, "90 min"]]} />
        </section>
        <Preview plan={preview} equip={o.equip} common={o.common} />
        <div className="row wrap"><button className="btn soft sm" onClick={() => setO({ ...o, variant: o.variant + 1 })}><Wand2 size={16} />Gerar outra variação</button>
          <button className="btn soft sm" onClick={() => { setDraft(clone(preview)); setTab("montar"); }}>Editar antes de usar</button></div>
        <div className="bottombar"><button className="btn" onClick={() => save(preview)}>Usar este treino</button></div>
      </>)}

      {tab === "montar" && (<>
        {result && <div className="banner info"><span>Reconheci {result.matched} exercício(s).{result.unmatched.length ? ` Não reconheci: ${result.unmatched.join(", ")}. Entraram como exercício próprio: defina o músculo na lista.` : ""}</span></div>}
        <section className="card">
          <h2>Dias de treino</h2>
          <div className="chips mt">{SHORT.slice(0, 6).map((s, i) => <button key={s} className={"chip lg sel" + (draft.days[i + 1] ? " on" : "")} aria-pressed={!!draft.days[i + 1]} onClick={() => toggleDay(i + 1)}>{s}</button>)}</div>
        </section>
        {sortedDays(draft).map(([n, d]) => { const isOpen = String(openDay ?? sortedDays(draft)[0][0]) === String(n); return (
          <section key={n} className="card dayed">
            <button className="dayed-h" aria-expanded={isOpen} onClick={() => setOpenDay(isOpen ? "none" : n)}>
              <span className="dchip num">{SHORT[n - 1]}</span>
              <span className="grow"><b className="dayed-t">{d.title}</b><small>{d.ex.length} exercícios · ~{Math.round(dayMins(draft, d))} min</small></span>
              <ChevronDown size={20} className={"chev" + (isOpen ? " up" : "")} />
            </button>
            {isOpen && (<div className="dayed-b">
              <input className="field title-in" aria-label={`Título de ${SHORT[n - 1]}`} value={d.title} onChange={(e) => upd((x) => { x.days[n].title = e.target.value; x.days[n].auto = false; })} />
              {d.ex.map((id, i) => {
                const e = exDef(draft, id); if (!e) return null; const timed = e.kind === "time";
                return (
                  <div key={id} className="exedit">
                    <div className="ee-top"><span className="grow"><b>{e.name}</b><small>{e.pri.length ? e.pri.map((m) => MUSCLE_NAME[m]).join(", ") : "Sem músculo definido"} · {EQ_NAME[e.eq]}</small></span>
                      <button className="icon-btn" aria-label="Subir" onClick={() => move(n, i, -1)}><ArrowUp size={16} /></button>
                      <button className="icon-btn" aria-label="Descer" onClick={() => move(n, i, 1)}><ArrowDown size={16} /></button>
                      <button className="icon-btn" aria-label={`Remover ${e.name}`} onClick={() => rmEx(n, id)}><X size={16} /></button></div>
                    {draft.custom[id] && !draft.custom[id].pri.length && <select className="field" aria-label="Músculo principal" value="" onChange={(ev) => upd((x) => { x.custom[id].pri = [ev.target.value]; x.custom[id].unknown = false; x.days[n].auto !== false && retitle(x, x.days[n]); })}><option value="">Definir músculo principal…</option>{Object.entries(MUSCLE_NAME).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
                    <div className={"ee-nums" + (timed ? " t3" : "")}>
                      <label>Séries<input type="number" inputMode="numeric" min="1" max="10" value={e.sets} onChange={(ev) => setOver(id, { sets: Math.max(1, Math.min(10, +ev.target.value || 1)) })} /></label>
                      <label>{timed ? "Segundos" : "Reps de"}<input type="number" inputMode="numeric" min="1" value={e.reps[0]} onChange={(ev) => setOver(id, { reps: [Math.max(1, +ev.target.value || 1), Math.max(e.reps[1], +ev.target.value || 1)] })} /></label>
                      {!timed && <label>até<input type="number" inputMode="numeric" min="1" value={e.reps[1]} onChange={(ev) => setOver(id, { reps: [Math.min(e.reps[0], +ev.target.value || 1), Math.max(1, +ev.target.value || 1)] })} /></label>}
                      <label>Desc. (s)<input type="number" inputMode="numeric" min="15" max="300" step="15" value={e.rest} onChange={(ev) => setOver(id, { rest: Math.max(15, Math.min(300, +ev.target.value || 60)) })} /></label>
                    </div>
                  </div>);
              })}
              <button className="btn soft mt" onClick={() => setPicker(n)}><Plus size={16} />Adicionar exercício</button>
            </div>)}
          </section>); })}
        {picker && draft.days[picker] && <Picker commonDefault={o.common} plan={draft} day={picker} onAdd={(id) => addEx(picker, id)} onCreate={(nw) => create(picker, nw)} onClose={() => setPicker(null)} />}
        {!Object.keys(draft.days).length && <p className="empty">Escolha os dias de treino acima.</p>}
        {canSave && (<>
          <section className="card">
            <h2><Lightbulb size={22} className="acc" />Sugestões para o seu treino</h2>
            <p className="small mute mt-s">Baseadas no volume semanal por músculo. Preferência de equipamento:</p><div className="mt-s"></div>
            <Choice value={eqPref} onChange={setEqPref} options={[["maquina", "Máquinas"], ["misto", "Misto"], ["livre", "Livres"]]} />
            {an.tips.length === 0 && <p className="ok-line mt">Seu treino está equilibrado: volume, frequência e ordem dentro do recomendado.</p>}
            {an.tips.map((t, i) => (
              <div key={i} className={"tip " + t.kind}>
                <p>{t.text}</p>
                {t.kind === "add" && <div className="chips tight">{t.cands.map((id) => <button key={id} className="chip sel on" onClick={() => suggestedAdd(t, id)}><Plus size={14} />{LIB.find((e) => e.id === id).name}</button>)}</div>}
                {t.kind === "order" && <button className="chip sel on" onClick={() => upd((x) => { x.days[t.n].ex = sortCompoundsFirst(x.days[t.n], x); })}>Ordenar dia</button>}
              </div>))}
          </section>
          <Preview plan={draft} equip={eqPref} common={o.common} />
        </>)}
        <div className="bottombar"><button className="btn" disabled={!canSave} onClick={() => save({ ...draft, mode: "custom" })}>Salvar meu treino</button></div>
      </>)}

      {tab === "colar" && (<>
        <section className="card form">
          <h2>Cole o treino que você já tem</h2>
          <p className="small mute mt-s">Um dia por linha, com os exercícios separados por vírgula. Séries e repetições são opcionais.</p><div className="mt"></div>
          <textarea rows={8} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={"Segunda: supino inclinado 4x8-10, crucifixo, tríceps corda\nTerça (costas): puxada, remada curvada, rosca direta\nQuarta: agachamento, leg press, panturrilha"} />
          {err && <div className="banner"><span>{err}</span></div>}
          <label className="gap mt">Preferência de equipamento (para escolher versões)</label>
          <Choice value={eqPref} onChange={setEqPref} options={[["maquina", "Máquinas"], ["misto", "Misto"], ["livre", "Livres"]]} />
        </section>
        <div className="bottombar"><button className="btn" disabled={!txt.trim()} onClick={interpret}>Interpretar treino</button></div>
      </>)}
    </main>
  );
}
