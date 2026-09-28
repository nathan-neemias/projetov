import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Send, Square, Camera, ClipboardCheck, Check, Sparkles, RotateCcw } from "lucide-react";
import { CHIPS, PHOTOS, buildContext, proposalLabel } from "./coach.js";
import { LIB_BY_ID } from "../../shared/lib.js";
import { PLAN } from "./data.js";
import { resizeImage } from "./Evolucao.jsx";
import { clonePlan } from "./plan.js";
import { dow, addDays, mondayOf, num, r1, todayIso } from "./util.js";
import { Seg, Sheet } from "./ui.jsx";
import Md from "./Md.jsx";

const ERR = {
  not_granted: "Você não permitiu o uso do Claude neste app. Recarregue e aceite o aviso para conversar com o coach.",
  rate_limited: "Muitas perguntas seguidas. Espere alguns segundos e tente de novo.",
  prompt_too_large: "A conversa ficou grande demais. Toque em “Nova conversa” e pergunte de novo.",
  images_unavailable: "Este aparelho não aceita fotos aqui. Descreva em texto.",
  image_rejected: "Não consegui ler essa foto. Tente outra imagem.",
  cancelled: "",
};
const errText = (e) => (e && e.message && e.code !== "cancelled" ? e.message : e && e.code in ERR ? ERR[e.code] : "O coach não conseguiu responder agora. Tente de novo em instantes.");
const MODE_NAME = { personal: "Personal", nutri: "Nutricionista" };
const trim = (arr) => arr.slice(-24).map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

function CheckinForm({ ctx, onSubmit, onClose }) {
  const { profile, days, date } = ctx;
  const wts = (profile.measures || []).filter((m) => m.peso && m.date > addDays(date, -7) && m.date <= date).map((m) => m.peso);
  const cs = [...(profile.measures || [])].filter((m) => m.cintura).sort((a, b) => a.date.localeCompare(b.date));
  const mon = mondayOf(date); let tr = 0, cd = 0; for (let i = 0; i < 7; i++) { const d = addDays(mon, i); if (days[d]?.finished) tr++; if (days[d]?.cardio) cd++; }
  const [f, setF] = useState({ peso: wts.length ? String(r1(wts.reduce((a, b) => a + b, 0) / wts.length)) : "", cintura: cs.length ? String(cs[cs.length - 1].cintura) : "", treinos: String(tr), cardio: String(cd), fome: "3", energia: "3", sono: "7", fadiga: "3", dor: "", adesao: "90", fora: "0", obs: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const scale = (k, label) => <label>{label}<select value={f[k]} onChange={set(k)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}{n === 1 ? " (baixo)" : n === 5 ? " (alto)" : ""}</option>)}</select></label>;
  return (
    <div className="form">
      <p className="small mute">Preenchi o que o app já sabe. Confira e ajuste.</p>
      <div className="row-2 mt-s"><label>Peso médio (kg)<input inputMode="decimal" value={f.peso} onChange={set("peso")} /></label><label>Cintura (cm)<input inputMode="decimal" value={f.cintura} onChange={set("cintura")} /></label></div>
      <div className="row-3"><label>Treinos feitos<input inputMode="numeric" value={f.treinos} onChange={set("treinos")} /></label><label>Dias de cardio<input inputMode="numeric" value={f.cardio} onChange={set("cardio")} /></label><label>Refeições fora<input inputMode="numeric" value={f.fora} onChange={set("fora")} /></label></div>
      <div className="row-2">{scale("fome", "Fome")}{scale("energia", "Energia")}</div>
      <div className="row-2">{scale("fadiga", "Fadiga")}<label>Sono (h por noite)<input inputMode="decimal" value={f.sono} onChange={set("sono")} /></label></div>
      <label>Aderência à dieta (%)<select value={f.adesao} onChange={set("adesao")}>{[100, 90, 80, 70, 60, 50].map((n) => <option key={n} value={n}>{n}%</option>)}</select></label>
      <label>Dores ou desconfortos<input value={f.dor} onChange={set("dor")} placeholder="Ex.: ombro direito ao supinar" /></label>
      <label>Observações<input value={f.obs} onChange={set("obs")} placeholder="Ex.: viagem, mau sono, aniversário" /></label>
      <button className="btn" onClick={() => onSubmit({ ...f, date, peso: num(f.peso) || null, cintura: num(f.cintura) || null })}>Enviar check-in ao coach</button>
    </div>
  );
}

export default function Coach({ ctx, open, onClose, initial }) {
  const { profile, setProfile } = ctx;
  const [mode, setMode] = useState("personal");
  const [msgs, setMsgs] = useState({ personal: [], nutri: [] });
  const [text, setText] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const [sample, setSample] = useState(undefined);
  const [photo, setPhoto] = useState(null), [checkin, setCheckin] = useState(false);
  const ctl = useRef(null), endRef = useRef(null), fileRef = useRef(null), photoKind = useRef(null), pending = useRef([]);

  useEffect(() => { if (!open) return; let live = true; fetch("/api/coach/status", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).then((st) => { if (live) setSample(st); }).catch(() => { if (live) setSample(null); }); return () => { live = false; }; }, [open]);
  useEffect(() => { if (!open) return; setMsgs({ personal: (profile.chat?.personal || []).map((m) => ({ ...m })), nutri: (profile.chat?.nutri || []).map((m) => ({ ...m })) }); setErr(""); if (initial) { setMode(initial.mode || "personal"); setText(initial.text || ""); } }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs, mode, busy, open]);
  useEffect(() => () => ctl.current?.abort(), []);

  const list = msgs[mode];
  const state = () => ({ profile, days: ctx.days, date: ctx.date, goal: ctx.goal, menu: ctx.menu, mealsN: ctx.mealsN });
  const persist = (m, arr) => setProfile((p) => ({ ...p, chat: { ...(p.chat || {}), [m]: trim(arr) } }));

  async function send(userText, opts = {}) {
    const raw = (userText || "").trim(); if (!raw || busy || !sample || !sample.enabled) return;
    setErr(""); const m = mode; const image = opts.image || null;
    const content = image ? `[Foto anexada: ${image.label}] ${raw}` : raw;
    const history = [...msgs[m], { role: "user", content }];
    setMsgs((s) => ({ ...s, [m]: [...history, { role: "assistant", content: "" }] })); setText(""); setPhoto(null); setBusy(true);
    pending.current = [];
    const ac = new AbortController(); ctl.current = ac;
    try {
      const payload = { mode: m, messages: history.slice(-14).map((x) => ({ role: x.role, content: x.content })), context: buildContext(m, state()), plan: Object.fromEntries(Object.entries(PLAN).map(([n, p]) => [n, p.ex])) };
      if (image) { const url = await resizeImage(image.file, 1280, 1280); payload.images = [{ media_type: "image/jpeg", data: url.split(",")[1] }]; }
      const resp = await fetch("/api/coach", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ac.signal });
      if (!resp.ok) { const j = await resp.json().catch(() => ({})); throw { code: resp.status === 429 ? "rate_limited" : "http", message: j.erro }; }
      let acc = "", truncated = false, fail = null, buf = "";
      const reader = resp.body.getReader(), dec = new TextDecoder();
      const handle = (raw) => {
        const line = raw.split("\n").find((l) => l.startsWith("data:")); if (!line) return;
        let ev; try { ev = JSON.parse(line.slice(5)); } catch { return; }
        if (ev.type === "text") { acc += ev.delta; setMsgs((st) => { const a2 = [...st[m]]; a2[a2.length - 1] = { role: "assistant", content: acc }; return { ...st, [m]: a2 }; }); }
        else if (ev.type === "proposal") pending.current.push(ev.proposal);
        else if (ev.type === "done") truncated = !!ev.truncated;
        else if (ev.type === "error") fail = ev;
      };
      for (;;) { const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); let i; while ((i = buf.indexOf("\n\n")) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 2); } }
      if (buf.trim()) handle(buf);
      if (fail && !acc) throw { code: fail.code, message: fail.message };
      if (!acc) throw { code: "empty", message: "O coach não devolveu resposta. Tente de novo." };
      const final = [...history, { role: "assistant", content: acc }];
      setMsgs((st) => { const a2 = [...st[m]]; a2[a2.length - 1] = { role: "assistant", content: acc, proposals: pending.current.slice(), truncated }; return { ...st, [m]: a2 }; });
      persist(m, final);
      if (fail) setErr(fail.message);
    } catch (e) {
      const partial = e && e.text;
      setMsgs((s) => { const a = [...s[m]]; if (partial) a[a.length - 1] = { role: "assistant", content: partial }; else a.pop(); return { ...s, [m]: a }; });
      if (partial) persist(m, [...history, { role: "assistant", content: partial }]); else persist(m, history);
      setErr(errText(e));
    } finally { setBusy(false); ctl.current = null; }
  }
  const stop = () => ctl.current?.abort();
  const reset = () => { if (busy) return; setMsgs((s) => ({ ...s, [mode]: [] })); persist(mode, []); setErr(""); };

  function apply(idx, p) {
    setProfile((pr) => {
      if (p.type === "metas") { const n = { ...pr }; if (p.kcal != null) n.kcal = p.kcal; if (p.prot != null) n.prot = p.prot; if (p.fat != null) n.fat = p.fat; return n; }
      if (p.type === "refeicoes") return { ...pr, mealsN: p.n };
      const pl = clonePlan(pr.plan); pl.over = pl.over || {};
      if (p.type === "descanso") { pl.over[p.id] = { ...(pl.over[p.id] || {}), rest: p.s }; return { ...pr, plan: pl }; }
      if (p.type === "troca") { const d = pl.days[p.dia]; if (!d || !d.ex.includes(p.sai) || !LIB_BY_ID[p.entra]) return pr; d.ex = d.ex.map((x) => (x === p.sai ? p.entra : x)); pl.mode = "custom"; return { ...pr, plan: pl, planSet: true }; }
      return pr;
    });
    setMsgs((s) => { const a = [...s[mode]]; a[idx] = { ...a[idx], proposals: a[idx].proposals.map((x) => (x.id === p.id ? { ...x, done: "ok" } : x)) }; return { ...s, [mode]: a }; });
  }
  const ignore = (idx, p) => setMsgs((s) => { const a = [...s[mode]]; a[idx] = { ...a[idx], proposals: a[idx].proposals.map((x) => (x.id === p.id ? { ...x, done: "no" } : x)) }; return { ...s, [mode]: a }; });

  const onFile = (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f || !photoKind.current) return; setPhoto({ file: f, ...photoKind.current, url: URL.createObjectURL(f) }); if (!text.trim()) setText(photoKind.current.prompt); };
  const pickPhoto = (k, label, prompt) => { photoKind.current = { kind: k, label, prompt }; fileRef.current?.click(); };
  const submitCheckin = (f) => {
    setProfile((p) => ({ ...p, checkins: [...(p.checkins || []), f].slice(-12) })); setCheckin(false);
    send(`Check-in semanal (${f.date}): peso médio ${f.peso ?? "sem"} kg; cintura ${f.cintura ?? "sem"} cm; treinos ${f.treinos}; cardio ${f.cardio} dias; fome ${f.fome}/5; energia ${f.energia}/5; fadiga ${f.fadiga}/5; sono ${f.sono} h; aderência à dieta ${f.adesao}%; refeições fora ${f.fora}; dores: ${f.dor || "nenhuma"}; observações: ${f.obs || "nenhuma"}. Faça a análise da semana comparando com as anteriores: o que manter, o que ajustar (menor ajuste capaz de gerar progresso) e o que medir na próxima semana.`);
  };

  if (!open) return null;
  const canImg = !!(sample && sample.enabled && sample.images);
  return (
    <div className="coach" role="dialog" aria-modal="true" aria-label="Coach">
      <header className="coach-h">
        <div className="row sb"><div className="row"><Sparkles size={20} className="acc" /><b className="coach-t">Coach</b></div>
          <div className="row"><button className="icon-btn" aria-label="Nova conversa" onClick={reset}><RotateCcw size={18} /></button><button className="icon-btn" aria-label="Fechar coach" onClick={onClose}><X size={22} /></button></div></div>
        <Seg value={mode} onChange={(v) => { if (!busy) setMode(v); }} options={[["personal", "Personal"], ["nutri", "Nutricionista"]]} />
      </header>
      <div className="coach-b">
        {sample === undefined && <p className="mute">Conectando…</p>}
        {sample === null && <div className="banner"><span>Não consegui falar com o servidor. Confira a conexão.</span></div>}
        {sample && !sample.enabled && <div className="banner"><span>O coach de IA ainda não foi ativado neste servidor. Quem administra precisa definir ANTHROPIC_API_KEY no arquivo .env.</span></div>}
        {list.length === 0 && sample && sample.enabled && (
          <div className="coach-empty">
            <p className="lead-c">Sou seu {mode === "personal" ? "personal trainer" : "nutricionista"}. Conheço seu {mode === "personal" ? "treino, cargas e medidas" : "cardápio, mercado, metas e medidas"} e respondo com base neles.</p>
            <div className="chips">{CHIPS[mode].map((c) => <button key={c} className="chip sel" onClick={() => send(c)}>{c}</button>)}</div>
          </div>)}
        {list.map((m, i) => (
          <div key={i} className={"msg " + m.role}>
            {m.role === "assistant" ? (m.content ? <Md text={m.content} /> : <p className="mute">Pensando…</p>) : <p>{m.content}</p>}
            {m.truncated && <p className="small mute">A resposta foi cortada. Peça “continue”.</p>}
            {(m.proposals || []).map((p) => (
              <div key={p.id} className={"prop " + (p.done || "")}>
                <p><b>Sugestão:</b> {proposalLabel(p)}</p>{p.motivo && <p className="small mute">{p.motivo}</p>}
                {!p.done && <div className="row mt-s"><button className="btn sm" onClick={() => apply(i, p)}><Check size={16} />Aplicar</button><button className="btn soft sm" onClick={() => ignore(i, p)}>Ignorar</button></div>}
                {p.done === "ok" && <span className="pill ok mt-s">Aplicado</span>}{p.done === "no" && <span className="pill mt-s">Ignorado</span>}
              </div>))}
          </div>))}
        {err && <div className="banner"><span>{err}</span></div>}
        <div ref={endRef} />
      </div>
      {sample && sample.enabled && (
        <footer className="coach-f">
          <div className="chips tight coach-tools">
            <button className="chip" onClick={() => setCheckin(true)}><ClipboardCheck size={14} />Check-in semanal</button>
            {canImg && PHOTOS[mode].map(([k, l, pr]) => <button key={k} className="chip" onClick={() => pickPhoto(k, l, pr)}><Camera size={14} />{l}</button>)}
          </div>
          {photo && <div className="attach"><img src={photo.url} alt="Foto anexada" /><span className="small">{photo.label}</span><button className="icon-btn" aria-label="Remover foto" onClick={() => setPhoto(null)}><X size={16} /></button></div>}
          <div className="coach-in">
            <textarea rows={1} value={text} placeholder="Pergunte ao coach…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text, { image: photo }); } }} aria-label="Mensagem" />
            {busy ? <button className="btn icon danger" aria-label="Parar" onClick={stop}><Square size={18} fill="currentColor" /></button> : <button className="btn icon" aria-label="Enviar" disabled={!text.trim()} onClick={() => send(text, { image: photo })}><Send size={20} /></button>}
          </div>
          <p className="small mute coach-note">Orientação educativa. Não substitui profissional de saúde. Respostas geradas por IA; confira antes de aplicar.</p>
          <input ref={fileRef} type="file" accept={"image/jpeg,image/png,image/webp"} hidden onChange={onFile} />
        </footer>)}
      <Sheet open={checkin} onClose={() => setCheckin(false)} title="Check-in semanal"><CheckinForm ctx={ctx} onSubmit={submitCheckin} onClose={() => setCheckin(false)} /></Sheet>
    </div>
  );
}
