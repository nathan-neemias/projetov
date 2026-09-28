import React, { useState } from "react";
import { SUPPS, SUPP_SLOTS, AVOID, FAQ } from "./data.js";
import { Check } from "lucide-react";
import { MachineArt, MACHINES } from "./machines.jsx";
import { exportData, importData, changePassword } from "./store.js";
import { LIB } from "../../shared/lib.js";
import BodyMap from "./bodymap.jsx";
import { Seg, Header } from "./ui.jsx";

export function Onboarding({ onDone, START, TARGET, num }) {
  const [f, setF] = useState({ peso: "89", altura: "179", start: START, target: TARGET });
  return (
    <main className="page welcome">
      <section className="w-hero">
        <div className="w-glow" />
        <div className="w-map"><BodyMap primary={["lats", "delt_l", "delt_r", "chest"]} secondary={["traps", "midback", "delt_f"]} compact /></div>
        <h1 className="title big">Projeto V</h1>
        <p className="w-lead">Shape estético em 13 semanas. Treino, dieta com o que você tem em casa, progressão de carga e evolução medida, tudo em um só lugar.</p>
      </section>
      <section className="card form">
        <h2>Confirme seus dados</h2>
        <div className="row-2 mt"><label>Peso (kg)<input inputMode="decimal" value={f.peso} onChange={(e) => setF({ ...f, peso: e.target.value })} /></label><label>Altura (cm)<input inputMode="numeric" value={f.altura} onChange={(e) => setF({ ...f, altura: e.target.value })} /></label></div>
        <div className="row-2"><label>Início do plano<input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label><label>Meta<input type="date" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></label></div>
        <button className="btn" onClick={() => onDone({ peso0: num(f.peso), altura: num(f.altura), start: f.start, target: f.target, measures: [{ date: f.start, peso: num(f.peso), cintura: null }] })}>Começar o plano</button>
      </section>
    </main>
  );
}

function NumField({ label, value, onCommit, unit, min = 1, max = 99999 }) {
  const [v, setV] = useState(String(value));
  React.useEffect(() => setV(String(value)), [value]);
  return <label>{label}<input inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} onFocus={(e) => e.target.select()} onBlur={() => { const n = parseInt(v, 10); if (n >= min && n <= max) onCommit(n); else setV(String(value)); }} aria-label={label + " em " + unit} /></label>;
}
const Pillar = ({ t, d }) => <div className="pillar"><b>{t}</b><p className="mute">{d}</p></div>;

export default function Guia({ ctx, sub, setSub }) {
  const { profile, setProfile, mode, save, reset, theme, setTheme, goal } = ctx;
  const pantry = profile.pantry || {}, sup = profile.supps || {};
  const have = (x) => (x.food ? !!pantry.whey : !!sup[x.id]);
  const toggleSupp = (x) => setProfile((p) => (x.food ? { ...p, pantry: { ...(p.pantry || {}), whey: !(p.pantry || {}).whey }, suppDone: true } : { ...p, supps: { ...(p.supps || {}), [x.id]: !(p.supps || {})[x.id] }, suppDone: true }));
  const owned = SUPPS.filter(have);
  const [confirm, setConfirm] = useState(false), [msg, setMsg] = useState(""), [pw, setPw] = useState({ a: "", n: "" });
  return (
    <main className="page">
      <Header kicker="Como tudo funciona" title="Guia" />
      <Seg value={sub} onChange={setSub} options={[["plano", "Plano"], ["maquinas", "Máquinas"], ["suplementos", "Suplem."], ["ajustes", "Ajustes"]]} />
      {sub === "plano" && (<>
        <section className="card"><h2>Os 4 pilares</h2><div className="mt"></div>
          <Pillar t="1. Treino com progressão" d="5 dias por semana. Toda semana você tenta mais carga ou mais repetições. Sem progressão, o músculo não tem motivo para crescer." />
          <Pillar t={`2. Dieta em déficit (${goal.kcal} kcal)`} d={`Cerca de 500 kcal abaixo da manutenção e ${goal.p} g de proteína por dia, só com os alimentos que você marcou no Mercado. O déficit faz a gordura sair e a proteína protege o músculo.`} />
          <Pillar t="3. Cardio e passos" d="20 a 30 minutos com inclinação 20 e velocidade 6, mais 8 a 10 mil passos por dia." />
          <Pillar t="4. Sono e medida" d="7 a 8 horas de sono. Peso, cintura e fotos a cada 2 semanas para ajustar com dados, não com achismo." />
        </section>
        <section className="card center"><h2 className="ctr">O que forma o V</h2><div className="mt"></div><BodyMap primary={["lats", "delt_l", "delt_r", "chest"]} secondary={["traps", "midback", "delt_f"]} /><p className="mute mt">Dorsal e ombro lateral alargam a parte de cima. O déficit calórico afina a cintura. O contraste entre os dois é o V.</p></section>
        <section className="card"><h2>Quanto descansar</h2><div className="mt"></div>
          <table className="rtable"><tbody>
            <tr><td><b>Compostos pesados</b><small>agachamento, leg press, supino, puxada</small></td><td className="num">2 a 3 min</td></tr>
            <tr><td><b>Compostos moderados</b><small>remadas, desenvolvimento, stiff</small></td><td className="num">90 s a 2 min</td></tr>
            <tr><td><b>Isoladores</b><small>polias, extensora, flexora, elevações</small></td><td className="num">45 a 90 s</td></tr>
            <tr><td><b>Abdômen e prancha</b></td><td className="num">30 a 60 s</td></tr>
            <tr><td><b>Trocar de aparelho</b><small>tempo para ajustar banco e carga</small></td><td className="num">até 60 s</td></tr>
          </tbody></table>
          <p className="small mute mt">Descansar pouco demais derruba as repetições da série seguinte. O cronômetro inicia sozinho ao concluir cada série, e você muda o tempo de cada exercício na tela do treino.</p>
        </section>
        <section className="card"><h2>Cadência e respiração</h2>
          <ul className="rules"><li><b>Compostos (2-1-1):</b> desce em 2 s, pausa de 1 s no alongamento, sobe forte em 1 s.</li><li><b>Isoladores (2-0-1):</b> desce em 2 s, sobe em 1 s e aperta o músculo por 1 s.</li><li>Expire no esforço (subida) e inspire na descida. Nunca prenda o ar em cargas altas.</li><li>Termine cada série perto da falha, com 1 a 2 repetições de reserva.</li></ul>
        </section>
        <section className="card"><h2>Coach com IA</h2><p className="mute mt-s">O botão “Coach” abre um personal trainer e um nutricionista de IA que conhecem o seu treino, as cargas, as medidas, o mercado e o cardápio. Eles sugerem mudanças (troca de exercício, descanso, metas, refeições) e você decide no botão Aplicar. Também fazem o check-in semanal e analisam fotos de prato, rótulo, máquina e físico.</p><p className="small mute mt-s">Roda no servidor com a chave da API configurada por quem administra o sistema (há limite diário de perguntas). Orientação educativa: não substitui profissional de saúde.</p><button className="btn mt" onClick={() => ctx.openCoach("personal")}>Abrir o coach</button></section>
        <section className="card"><h2>Perguntas frequentes</h2><div className="mt"></div>{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p className="muted">{a}</p></details>)}</section>
      </>)}
      {sub === "maquinas" && (<div className="stack">
        <p className="mute">As máquinas e polias que praticamente toda academia tem. Cada exercício do seu treino usa uma delas.</p>
        {Object.entries(MACHINES).map(([id, m]) => { const ex = LIB.filter((e) => e.mach === id && !e.rare).map((e) => e.name); return (
          <section key={id} className="card mcard">
            <MachineArt id={id} />
            <div className="row sb mt"><h2>{m.name}</h2><span className="pill ok">{m.where}</span></div>
            {ex.length > 0 && <p className="small mute mt-s"><b>Exercícios:</b> {ex.join(", ")}.</p>}
            <h3 className="h3">Como ajustar</h3><ul className="rules">{m.setup.map((s) => <li key={s}>{s}</li>)}</ul>
            <h3 className="h3">Erro comum</h3><p className="small mute">{m.mistake}</p>
          </section>); })}
      </div>)}
      {sub === "suplementos" && (<>
        <p className="mute">Marque só o que você comprou. A sua rotina é montada com esses itens.</p>
        <section className="card">
          <div className="eyebrow">Meu protocolo</div>
          {owned.length === 0 ? (<><p className="mute">Nenhum suplemento marcado ainda.</p><button className="btn soft mt" onClick={() => setProfile((p) => ({ ...p, suppDone: true }))}>{profile.suppDone ? "Ok, não uso nenhum" : "Não uso nenhum"}</button></>) :
            [...SUPP_SLOTS, "Cardápio"].map((sl) => { const its = owned.filter((x) => x.slot === sl); if (!its.length) return null; return (<div key={sl} className="proto"><div className="label">{sl}</div>{its.map((x) => <p key={x.id}><b>{x.name}</b>: {x.dose}. <span className="mute">{x.when}.</span></p>)}</div>); })}
        </section>
        {SUPPS.map((x) => (
          <section key={x.id} className="card">
            <div className="row-h"><h2>{x.name}</h2><span className={"pill lvl" + x.lvl}>{x.ev}</span></div>
            <p><b>{x.dose}.</b> {x.when}.</p><p className="mute">{x.why}</p>
            <button className={"crow tnh" + (have(x) ? " on" : "")} aria-pressed={have(x)} onClick={() => toggleSupp(x)}><span className="box">{have(x) && <Check size={15} strokeWidth={3.2} />}</span><span className="grow">{x.food ? "Tenho (entra no cardápio)" : "Tenho comprado"}</span></button>
          </section>))}
        <section className="card danger-card"><h2>O que não recomendo</h2><ul className="rules">{AVOID.map((a) => <li key={a}>{a}</li>)}</ul><p className="mute small mt">Converse com seu médico antes de iniciar qualquer suplemento, principalmente por ter feito procedimentos recentes.</p></section>
      </>)}
      {sub === "ajustes" && (<>
        <section className="card"><h2>Conta e dados</h2><div className="mt-s"></div>
          <p className="mute">Conectado como <b>{ctx.user?.email}</b>. Seus dados ficam no servidor do seu sistema, com acesso só por login.</p>
          {save && <p className="mute small mt-s">{save === "saving" ? "Salvando…" : save === "saved" ? "Tudo salvo." : "Falha ao salvar. Verifique a conexão; tento de novo na próxima alteração."}</p>}
          <div className="row mt wrap">
            <button className="btn soft sm" onClick={() => exportData().catch(() => setMsg("Não foi possível exportar."))}>Exportar meus dados</button>
            <label className="btn soft sm filebtn">Importar<input type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; try { const j = JSON.parse(await f.text()); const r = await importData(j.docs); setMsg(`${r.importados} itens importados. Recarregue a página.`); } catch { setMsg("Arquivo inválido."); } }} /></label>
            <button className="btn soft sm" onClick={ctx.logout}>Sair</button>
          </div>
          {msg && <p className="small ok-line mt-s" role="status">{msg}</p>}
        </section>
        <section className="card form"><h2>Trocar senha</h2><div className="mt"></div>
          <label>Senha atual<input type="password" autoComplete="current-password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></label>
          <label>Nova senha (mínimo 8 caracteres)<input type="password" autoComplete="new-password" value={pw.n} onChange={(e) => setPw({ ...pw, n: e.target.value })} /></label>
          <button className="btn soft" onClick={async () => { try { await changePassword(pw.a, pw.n); setPw({ a: "", n: "" }); setMsg("Senha alterada. Outros aparelhos precisarão entrar de novo."); } catch (e) { setMsg(e.message); } }}>Alterar senha</button>
        </section>
        <section className="card form"><h2>Metas de dieta</h2><div className="mt"></div>
          <div className="row-3"><NumField label="Calorias" unit="kcal" min={1200} max={6000} value={goal.kcal} onCommit={(n) => setProfile((p) => ({ ...p, kcal: n }))} /><NumField label="Proteína" unit="g" min={60} max={400} value={goal.p} onCommit={(n) => setProfile((p) => ({ ...p, prot: n }))} /><NumField label="Gordura" unit="g" min={20} max={200} value={goal.g} onCommit={(n) => setProfile((p) => ({ ...p, fat: n }))} /></div>
          <p className="mute small">Carboidrato calculado: {goal.c} g. O cardápio se ajusta sozinho quando você muda as metas.</p>
          <button className="btn soft mt" onClick={() => setProfile((p) => { const q = { ...p }; delete q.kcal; delete q.prot; delete q.fat; return q; })}>Restaurar padrão (2450 kcal, 200 g de proteína)</button>
        </section>
        <section className="card form"><h2>Descanso entre séries</h2><div className="mt"></div>
          <label>Ritmo dos intervalos<select value={String(profile.restScale || 1)} onChange={(e) => setProfile((p) => ({ ...p, restScale: parseFloat(e.target.value) }))}><option value="0.8">Mais curto (-20%)</option><option value="1">Recomendado</option><option value="1.25">Mais longo (+25%)</option></select></label>
          <button className={"crow tnh" + (profile.autoRest !== false ? " on" : "")} aria-pressed={profile.autoRest !== false} onClick={() => setProfile((p) => ({ ...p, autoRest: p.autoRest === false }))}><span className="box">{profile.autoRest !== false && <Check size={15} strokeWidth={3.2} />}</span><span className="grow">Iniciar o cronômetro ao concluir a série<small>Com som e vibração quando acabar</small></span></button>
        </section>
        <section className="card form"><h2>Plano</h2><div className="mt"></div>
          <label>Início<input type="date" value={profile.start} onChange={(e) => setProfile((p) => ({ ...p, start: e.target.value }))} /></label>
          <label>Meta<input type="date" value={profile.target} onChange={(e) => setProfile((p) => ({ ...p, target: e.target.value }))} /></label>
          <label>Tema<select value={theme} onChange={(e) => setTheme(e.target.value)}><option value="auto">Automático</option><option value="light">Claro</option><option value="dark">Escuro</option></select></label>
        </section>
        <section className="card"><h2>Apagar tudo</h2><p className="mute small mt-s">Remove treinos, medidas e fotos. Não dá para desfazer.</p>
          {!confirm ? <button className="btn soft danger mt" onClick={() => setConfirm(true)}>Apagar todos os dados</button> : <div className="row mt wrap"><button className="btn danger" onClick={async () => { await reset(); setConfirm(false); }}>Sim, apagar</button><button className="btn soft" onClick={() => setConfirm(false)}>Cancelar</button></div>}
        </section>
      </>)}
    </main>
  );
}
