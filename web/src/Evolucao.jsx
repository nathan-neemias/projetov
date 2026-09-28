import React, { useState, useMemo, useRef } from "react";
import { Camera, X, Trophy } from "lucide-react";
import { EX, MUSCLE_NAME } from "./data.js";
import { parse, iso, addDays, fmtDM, num, r1, e1rm, signed, dow, mondayOf, weekOf, diffDays } from "./util.js";
import { AreaChart, Seg, Header } from "./ui.jsx";
import { goalWeight, sortedMeasures } from "./Hoje.jsx";
import { DELOAD_WEEK } from "./data.js";

const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
function analyze(ms, date) {
  const w = ms.filter((m) => m.peso), inR = (a, b) => w.filter((m) => m.date > addDays(date, -a) && m.date <= addDays(date, -b)).map((m) => m.peso);
  const A = inR(7, 0), B = inR(14, 7);
  if (A.length < 2 || B.length < 2) return { ok: false, text: "Registre o peso 3 vezes por semana, em jejum. Com 2 semanas de dados eu analiso o ritmo e digo se precisa ajustar as calorias." };
  const d = avg(A) - avg(B);
  if (d > -0.15) return { ok: true, tone: "warn", d, adj: -150, text: `A média da semana ${d > 0.15 ? "subiu" : "ficou parada"} (${signed(d)} kg). Se isso se repetir por 2 semanas, tire 150 a 200 kcal de carboidrato, cerca de 40 g.` };
  if (d < -0.8) return { ok: true, tone: "warn", d, adj: 150, text: `Você está perdendo rápido demais (${signed(d)} kg na semana). Some 150 kcal, cerca de 40 g de carboidrato, para preservar músculo e força.` };
  return { ok: true, tone: "ok", d, text: `No ritmo certo: ${signed(d)} kg na semana. Não mexa em nada.` };
}

export function resizeImage(file, maxW = 480, maxH = 640) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => {
      const k = Math.min(1, maxW / im.width, maxH / im.height), c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.68));
    }; im.src = fr.result; };
    fr.readAsDataURL(file);
  });
}

function Corpo({ ctx }) {
  const { profile, date, setProfile, goal } = ctx;
  const [f, setF] = useState({ date: date < profile.start ? profile.start : date, peso: "", cintura: "" });
  const ms = sortedMeasures(profile), wts = ms.filter((m) => m.peso), cs = ms.filter((m) => m.cintura);
  const lastW = wts[wts.length - 1], lastC = cs[cs.length - 1];
  const a7 = wts.filter((m) => m.date > addDays(date, -7) && m.date <= date).map((m) => m.peso);
  const pts = wts.map((m) => ({ x: parse(m.date).getTime(), y: m.peso }));
  const smooth = wts.map((m) => { const w = wts.filter((x) => x.date <= m.date && x.date > addDays(m.date, -7)).map((x) => x.peso); return { x: parse(m.date).getTime(), y: r1(avg(w)) }; });
  const target = [{ x: parse(profile.start).getTime(), y: profile.peso0 }, { x: parse(profile.target).getTime(), y: goalWeight(profile) }];
  const an = analyze(ms, date);
  const add = () => {
    if (!num(f.peso) && !num(f.cintura)) return;
    setProfile((p) => { const cur = (p.measures || []).find((m) => m.date === f.date) || {}; return { ...p, measures: [...(p.measures || []).filter((m) => m.date !== f.date), { date: f.date, peso: num(f.peso) || cur.peso || null, cintura: num(f.cintura) || cur.cintura || null }] }; });
    setF({ ...f, peso: "", cintura: "" });
  };
  const wk = date < profile.start ? 0 : weekOf(profile.start, date);
  return (<>
    <div className="stats">
      <div className="stat"><b className="num">{lastW ? lastW.peso.toFixed(1) : "-"}</b><small>kg agora{wts.length > 1 ? ` · ${signed(lastW.peso - wts[0].peso)}` : ""}</small></div>
      <div className="stat"><b className="num">{a7.length ? r1(avg(a7)).toFixed(1) : "-"}</b><small>média 7 dias</small></div>
      <div className="stat"><b className="num">{lastC ? lastC.cintura.toFixed(1) : "-"}</b><small>cm cintura{cs.length > 1 ? ` · ${signed(lastC.cintura - cs[0].cintura)}` : ""}</small></div>
    </div>
    <section className={"card analysis " + (an.tone || "")}><div className="eyebrow">Análise da semana</div><p className="anl">{an.text}</p>{an.adj ? (goal.kcal + an.adj < 2200 ? <p className="muted small">A meta já está perto do mínimo seguro de 2.200 kcal. Prefira aumentar cardio e passos.</p> : <button className="btn soft mt" onClick={() => setProfile((p) => ({ ...p, kcal: goal.kcal + an.adj }))}>{an.adj < 0 ? "Reduzir" : "Somar"} 150 kcal: nova meta {goal.kcal + an.adj} kcal</button>) : null}</section>
    <section className="card form">
      <h2>Registrar medidas</h2>
      <p className="small mute mt-s">Cintura na altura do umbigo, sem encolher a barriga. Meça a cada 2 semanas.</p><div className="mt"></div>
      <div className="row-3 dates"><label>Data<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label><label>Peso (kg)<input inputMode="decimal" value={f.peso} onChange={(e) => setF({ ...f, peso: e.target.value })} /></label><label>Cintura (cm)<input inputMode="decimal" value={f.cintura} onChange={(e) => setF({ ...f, cintura: e.target.value })} /></label></div>
      <button className="btn" onClick={add}>Salvar medidas</button>
          </section>
    <section className="card"><h2>Peso</h2><p className="small mute mt-s">Linha forte: média de 7 dias. Tracejada: meta de {goalWeight(profile).toFixed(1).replace(".", ",")} kg.</p><AreaChart series={[{ pts: smooth }, { pts }]} target={target} /></section>
    <section className="card"><h2>Cintura</h2><AreaChart series={[{ pts: cs.map((m) => ({ x: parse(m.date).getTime(), y: m.cintura })) }]} unit=" cm" /></section>
    <section className="card"><h2>As 13 semanas</h2><div className="mt"></div>
      <div className="weeks">{Array.from({ length: 13 }, (_, i) => { const s = addDays(profile.start, i * 7), has = ms.some((m) => m.date >= s && m.date < addDays(s, 7)); return (<div key={i} className={"wk" + (wk === i + 1 ? " cur" : "") + (i + 1 === DELOAD_WEEK ? " dl" : "") + (has ? " has" : "")}><b className="num">{i + 1}</b><small>{fmtDM(s)}</small></div>); })}</div>
      <p className="small mute">Contorno laranja: semana atual. Verde: tem medida registrada. Tracejada: deload (semana 7).</p>
    </section>
    <section className="card"><h2>Histórico</h2><div className="mt"></div>
      {ms.length === 0 && <p className="empty">Nenhuma medida ainda.</p>}
      {ms.slice().reverse().map((m) => (<div key={m.date} className="pr"><span>{fmtDM(m.date)}</span><span className="num">{m.peso ? m.peso.toFixed(1) + " kg" : "-"} · {m.cintura ? m.cintura.toFixed(1) + " cm" : "-"}</span><button className="icon-btn" aria-label="Apagar medida" onClick={() => setProfile((p) => ({ ...p, measures: p.measures.filter((x) => x.date !== m.date) }))}><X size={16} /></button></div>))}
    </section>
  </>);
}

function Cargas({ ctx }) {
  const { days, date } = ctx;
  const [sel, setSel] = useState("");
  const hist = useMemo(() => {
    const out = {};
    Object.keys(days).sort().forEach((d) => Object.entries(days[d].sets || {}).forEach(([id, sets]) => {
      const done = sets.filter((s) => s.done && num(s.kg) > 0); if (!done.length || !EX[id]) return;
      const best = done.reduce((a, s) => (num(s.kg) > num(a.kg) ? s : a), done[0]);
      (out[id] = out[id] || []).push({ date: d, kg: num(best.kg), reps: num(best.reps) });
    }));
    return out;
  }, [days]);
  const ids = Object.keys(hist), cur = sel && hist[sel] ? sel : ids[0];
  const prs = ids.map((id) => ({ id, a: hist[id][0].kg, b: Math.max(...hist[id].map((h) => h.kg)) })).filter((p) => p.b > p.a).sort((x, y) => y.b - y.a - (x.b - x.a)).slice(0, 6);
  const vol = useMemo(() => { const w = {}; Object.keys(days).forEach((d) => { const v = Object.values(days[d].sets || {}).reduce((a, arr) => a + arr.filter((s) => s.done).reduce((b, s) => b + num(s.kg) * num(s.reps), 0), 0); if (v > 0) { const m = mondayOf(d); w[m] = (w[m] || 0) + v; } }); return Object.entries(w).sort(); }, [days]);
  if (!ids.length) return <section className="card"><p className="empty">Conclua séries nos treinos para acompanhar aqui a evolução de cada exercício.</p></section>;
  const maxV = Math.max(...vol.map((v) => v[1]));
  return (<>
    <section className="card"><h2>Carga por exercício</h2><div className="mt"></div>
      <select className="field" value={cur} onChange={(e) => setSel(e.target.value)} aria-label="Exercício">{ids.map((id) => <option key={id} value={id}>{EX[id].name}</option>)}</select>
      <AreaChart series={[{ pts: hist[cur].map((h) => ({ x: parse(h.date).getTime(), y: h.kg })) }]} unit=" kg" empty="Faça este exercício em pelo menos 2 treinos para ver a evolução." />
      <p className="small mute">Melhor série de cada treino. Última: {hist[cur][hist[cur].length - 1].kg} kg × {hist[cur][hist[cur].length - 1].reps}.</p>
    </section>
    {prs.length > 0 && <section className="card"><h2><Trophy size={22} className="acc" />Maiores ganhos de carga</h2><div className="mt"></div>{prs.map((p) => <div key={p.id} className="pr"><span>{EX[p.id].name}</span><b className="num">{p.a} → {p.b} kg</b></div>)}</section>}
    <section className="card"><h2>Volume por semana</h2><p className="small mute mt-s">Carga × repetições somadas. Deve subir ao longo das semanas (exceto no deload).</p><div className="mt"></div>
      {vol.map(([m, v]) => <div key={m} className="bar"><div className="bar-top"><span>Semana de {fmtDM(m)}</span><b className="num">{Math.round(v).toLocaleString("pt-BR")} kg</b></div><div className="track"><div className="fill" style={{ width: (v / maxV) * 100 + "%" }} /></div></div>)}
    </section>
  </>);
}

function Fotos({ ctx }) {
  const { profile, photos, setPhoto } = ctx;
  const cps = Array.from({ length: 7 }, (_, i) => addDays(profile.start, i * 14));
  const [angle, setAngle] = useState("front"), [a, setA] = useState(cps[0]), [b, setB] = useState(cps[1]);
  const [busy, setBusy] = useState(""), [err, setErr] = useState("");
  const names = { front: "Frente", side: "Lado", back: "Costas" };
  const onFile = async (d, ang, file) => { if (!file) return; setErr(""); setBusy(d + ang); try { setPhoto(d, ang, await resizeImage(file)); } catch { setErr("Não foi possível ler a foto. Tente outra imagem."); } setBusy(""); };
  const withPhotos = cps.filter((d) => photos[d] && Object.keys(photos[d]).length);
  return (<>
    <p className="mute">Tire as fotos a cada 2 semanas: mesma luz, mesma distância, em jejum e sem camisa. As fotos ficam só na sua conta.</p>
    {err && <div className="banner"><span>{err}</span></div>}
    {cps.map((d, i) => (
      <section key={d} className="card">
        <div className="row-h"><h2>Semana {i * 2 + 1}</h2><span className="mute">{fmtDM(d)}</span></div>
        <div className="photos mt">{["front", "side", "back"].map((ang) => (
          <label key={ang} className="ph">
            {photos[d]?.[ang] ? <img src={photos[d][ang]} alt={`${names[ang]}, semana ${i * 2 + 1}`} /> : <span className="ph-empty"><Camera size={22} /><small>{busy === d + ang ? "Salvando…" : names[ang]}</small></span>}
            <input type="file" accept="image/*" onChange={(e) => onFile(d, ang, e.target.files[0])} />
          </label>))}
        </div>
      </section>))}
    {withPhotos.length >= 2 && (
      <section className="card"><h2>Comparar</h2><div className="mt"></div>
        <Seg value={angle} onChange={setAngle} options={[["front", "Frente"], ["side", "Lado"], ["back", "Costas"]]} />
        <div className="row-2"><select className="field" value={a} onChange={(e) => setA(e.target.value)} aria-label="Antes">{withPhotos.map((d) => <option key={d} value={d}>{fmtDM(d)}</option>)}</select><select className="field" value={b} onChange={(e) => setB(e.target.value)} aria-label="Depois">{withPhotos.map((d) => <option key={d} value={d}>{fmtDM(d)}</option>)}</select></div>
        <div className="compare">{[a, b].map((d, i) => <div key={i}>{photos[d]?.[angle] ? <img src={photos[d][angle]} alt={`${names[angle]} em ${fmtDM(d)}`} /> : <span className="ph-empty"><small>Sem foto</small></span>}<small>{i ? "Depois" : "Antes"} · {fmtDM(d)}</small></div>)}</div>
      </section>)}
  </>);
}

export default function Evolucao({ ctx, sub, setSub }) {
  return (
    <main className="page">
      <Header kicker="Seu progresso" title="Evolução" />
      <Seg value={sub} onChange={setSub} options={[["corpo", "Corpo"], ["cargas", "Cargas"], ["fotos", "Fotos"]]} />
      <div className="stack">
        {sub === "corpo" && <Corpo ctx={ctx} />}
        {sub === "cargas" && <Cargas ctx={ctx} />}
        {sub === "fotos" && <Fotos ctx={ctx} />}
      </div>
    </main>
  );
}
