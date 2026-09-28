import React, { useState } from "react";
import { Check, X, RefreshCw, Plus, ShoppingBasket, Info, Copy, Clock, ChefHat, ChevronDown } from "lucide-react";
import { RULES } from "./data.js";
import { FOODS, CATS, SECTIONS, BASIC, MARKET_BASE, MARKET_TOOLS, MEAL_PLANS, RECIPES, MEAL_PREP, generateMenu, weekShopping, seedFor, fmtQty, homeQty, dishName, plateTip, recipeMacros, kcalOf, makeCustomFood } from "./diet.js";
import { addDays, dow, num, fmtDM, fmtLong } from "./util.js";
import { MacroRing, Seg, Tap, Header, Sheet } from "./ui.jsx";
import { pantryReady } from "./Hoje.jsx";

const nf = (n) => Math.round(n);
const hint = (f) => `P ${f.p} · C ${f.c} · G ${f.g} /${f.u === "g" || f.u === "ml" ? "100 " + f.u : f.u === "col" ? "col." : f.u === "livre" ? "porção" : "un."}`;
const SEC_COLOR = { carnes: "var(--r-treino)", ovos: "var(--r-cardio)", frutas: "var(--r-dieta)", verduras: "var(--ok)", graos: "var(--warn)", padaria: "var(--ice)", gorduras: "var(--ice)", suple: "var(--acc)" };
const MEAL_LABEL = { cafe: "Café", lanche: "Lanche", almoco: "Almoço", pre: "Pré-treino", jantar: "Jantar", ceia: "Ceia" };

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch { try { const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch { return false; } }
}

function MealItems({ items }) {
  return (
    <ul className="items">
      {items.map(([id, q]) => { const h = homeQty(id, q); return (
        <li key={id}><span className="it-n">{FOODS[id].n}{h.sub && <small>{h.sub}</small>}</span><b>{h.main}</b></li>); })}
    </ul>
  );
}
function Prep({ items }) {
  const list = items.filter(([id]) => FOODS[id].prep && FOODS[id].prep.how.length && FOODS[id].u !== "livre" && !["fruta"].includes(FOODS[id].cat));
  return (
    <details className="prep" onClick={(e) => e.stopPropagation()}>
      <summary><ChefHat size={16} />Como preparar</summary>
      {list.map(([id]) => (<div key={id} className="prep-i"><b>{FOODS[id].n}</b><ol>{FOODS[id].prep.how.map((s, i) => <li key={i}>{s}</li>)}</ol>{FOODS[id].prep.store ? <p className="small mute">Guardar: {FOODS[id].prep.store}</p> : null}</div>))}
    </details>
  );
}

function Hoje({ ctx, setSub }) {
  const { profile, setProfile, date, days, setDay, goal, menu } = ctx;
  const day = days[date] || {}, meals = day.meals || {}, extra = day.extra || { p: 0, c: 0, g: 0 };
  const eaten = Object.values(meals).reduce((a, x) => (x && typeof x === "object" ? { p: a.p + x.p, c: a.c + x.c, g: a.g + x.g } : a), { p: 0, c: 0, g: 0 });
  const t = { p: eaten.p + extra.p, c: eaten.c + extra.c, g: eaten.g + extra.g };
  const [ex, setEx] = useState({ p: "", c: "", g: "" });
  const anyEaten = Object.values(meals).some(Boolean);
  const mealsN = ctx.mealsN, plan = MEAL_PLANS[mealsN];
  if (menu.empty) return (
    <section className="card"><h2>Falta marcar o mercado</h2><p className="mute mt-s">O cardápio é montado só com o que você comprou. Marque pelo menos uma proteína e um carboidrato.</p><button className="btn mt" onClick={() => setSub("mercado")}>Abrir o mercado</button></section>
  );
  return (<div className="stack">
    <section className="card">
      <div className="row sb"><h2>Refeições por dia</h2><span className="pill acc">{plan.perMeal} de proteína</span></div>
      <div className="seg mt" role="tablist">{[3, 4, 5, 6].map((n) => <button key={n} role="tab" aria-selected={mealsN === n} className={mealsN === n ? "on" : ""} onClick={() => setProfile((p) => ({ ...p, mealsN: n }))}>{n}</button>)}</div>
      <p className="small mute">{plan.note}</p>
      <p className="small mute mt-s"><b>Regra de ouro:</b> uma dose de 30 a 50 g de proteína a cada 3 a 4 horas. Mudar o número de refeições refaz o cardápio, e as refeições já marcadas hoje continuam contando.</p>
    </section>
    {dow(date) === 6 && <div className="banner"><Info size={18} /><span><b>Sábado de recarga.</b> Some cerca de 100 g de carboidrato (arroz, batata ou massa) e mantenha a proteína.</span></div>}
    {menu.warnings.map((w) => <div key={w} className="banner"><Info size={18} /><span>{w}</span></div>)}
    <section className="card">
      <div className="mrings four"><MacroRing label="Calorias" value={kcalOf(t)} goal={goal.kcal} unit=" kcal" color="var(--r-treino)" size={70} /><MacroRing label="Proteína" value={t.p} goal={goal.p} unit=" g" color="var(--r-dieta)" size={70} /><MacroRing label="Carbo" value={t.c} goal={goal.c} unit=" g" color="var(--r-cardio)" size={70} /><MacroRing label="Gordura" value={t.g} goal={goal.g} unit=" g" color="var(--r-agua)" size={70} /></div>
      <p className="small mute mt">O cardápio de hoje soma {nf(menu.totals.kcal)} kcal (P {nf(menu.totals.p)}, C {nf(menu.totals.c)}, G {nf(menu.totals.g)}).</p>
      {!anyEaten && <button className="btn soft mt" onClick={() => setDay(date, (d) => ({ ...d, varSeed: (d.varSeed || 0) + 1 }))}><RefreshCw size={16} />Variar cardápio de hoje</button>}
    </section>
    <div className="grid two">
      {menu.meals.map((m, i) => (
        <Tap key={i} className={"meal" + (meals[i] ? " on" : "")} pressed={!!meals[i]} onClick={() => setDay(date, (d) => { const cur = d.meals || {}; return { ...d, meals: { ...cur, [i]: cur[i] ? false : { p: m.p, c: m.c, g: m.g } } }; })}>
          <div className="meal-h"><div className="grow"><h2>{m.name}</h2><div className="small mute"><Clock size={12} style={{ verticalAlign: "-1px" }} /> {m.time}</div></div><span className="box lg">{meals[i] && <Check size={18} strokeWidth={3.2} />}</span></div>
          <p className="dish">{dishName(m)}</p>
          <MealItems items={m.items} />
          <div className="mpills"><span className="mp p">P {nf(m.p)}</span><span className="mp c">C {nf(m.c)}</span><span className="mp g">G {nf(m.g)}</span><span className="mp k">{nf(m.kcal)} kcal</span></div>
          <p className="small mute mt-s">{plateTip(m)}</p>
          <Prep items={m.items} />
        </Tap>))}
    </div>
    <button className="btn soft" onClick={() => ctx.openCoach("nutri", "Ajuste meu cardápio de hoje: ")}>Pedir ajuste ao nutricionista</button>
    <details className="card"><summary>Como pesar e medir</summary>
      <ul className="rules"><li><b>Pese o alimento pronto</b> (cozido ou grelhado) na balança, com o prato zerado. É o padrão deste app.</li><li>Cada item mostra a medida caseira (colher de servir, filé, concha) e o peso cru quando útil para comprar ou cozinhar.</li><li>Frango e carnes perdem cerca de 25 a 30% do peso ao cozinhar: 210 g crus viram cerca de 150 g grelhados.</li><li>Arroz e massas dobram ou mais: 100 g de arroz cru viram cerca de 220 g cozidos.</li><li>Sem balança, use a palma da mão como referência de proteína: 1 palma ≈ 90 a 100 g.</li></ul>
    </details>
    <details className="card"><summary>Comeu algo fora do plano?</summary>
      <div className="form">
        <p className="small mute">Informe os macros para entrar na conta do dia.</p>
        <div className="row-3 mt-s">{[["p", "Proteína"], ["c", "Carbo"], ["g", "Gordura"]].map(([k, l]) => <label key={k}>{l} (g)<input inputMode="decimal" value={ex[k]} onChange={(e) => setEx({ ...ex, [k]: e.target.value })} /></label>)}</div>
        <div className="row wrap">
          <button className="btn soft sm" onClick={() => { setDay(date, (d) => { const e0 = d.extra || { p: 0, c: 0, g: 0 }; return { ...d, extra: { p: e0.p + num(ex.p), c: e0.c + num(ex.c), g: e0.g + num(ex.g) } }; }); setEx({ p: "", c: "", g: "" }); }}>Adicionar</button>
          {(extra.p || extra.c || extra.g) ? <button className="btn soft sm" onClick={() => setDay(date, (d) => ({ ...d, extra: { p: 0, c: 0, g: 0 } }))}>Zerar extras</button> : null}
        </div>
      </div>
    </details>
    <details className="card"><summary>Regras da fase rigorosa</summary><ul className="rules">{RULES.map((r, i) => <li key={i}>{r}</li>)}</ul></details>
  </div>);
}

function Semana({ ctx }) {
  const { profile, date, goal, mealsN } = ctx, pantry = profile.pantry || {};
  if (!pantryReady(pantry)) return <section className="card"><p className="mute">Marque no Mercado pelo menos uma proteína e um carboidrato para ver a semana.</p></section>;
  return (<div className="stack">
    <p className="mute">Os próximos 7 dias, variando as fontes entre os alimentos que você marcou, em {mealsN} refeições por dia.</p>
    <div className="grid two">
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(date, i), m = generateMenu(pantry, goal, seedFor(d), mealsN);
        return (
          <section key={d} className="card">
            <div className="row sb"><h2>{fmtLong(d).split(",")[0].replace(/^./, (c) => c.toUpperCase())}<small className="mute dm">{fmtDM(d)}</small></h2><span className="num kc">{nf(m.totals.kcal)}<small> kcal</small></span></div>
            <div className="mt-s">{m.meals.map((x) => <p key={x.key} className="small wk-l"><b>{MEAL_LABEL[x.key] || x.name}:</b> <span className="mute">{dishName(x).replace("Prato: ", "")}</span></p>)}</div>
            <div className="mpills"><span className="mp p">P {nf(m.totals.p)}</span><span className="mp c">C {nf(m.totals.c)}</span><span className="mp g">G {nf(m.totals.g)}</span></div>
          </section>);
      })}
    </div>
    <section className="card"><h2><ChefHat size={22} className="acc" />Preparo da semana (cerca de 2 h)</h2>
      <ol className="steps">{MEAL_PREP.map((s, i) => <li key={i}>{s}</li>)}</ol></section>
  </div>);
}

function Pratos({ ctx }) {
  const { profile } = ctx, pantry = profile.pantry || {};
  const [f, setF] = useState("todos"), [only, setOnly] = useState(false);
  const opts = [["todos", "Todos"], ["cafe", "Café"], ["lanche", "Lanche / pré"], ["almoco", "Almoço / jantar"], ["ceia", "Ceia"]];
  const match = (r) => f === "todos" || (f === "lanche" ? r.meals.includes("pre") || r.meals.includes("lanche") : f === "almoco" ? r.meals.includes("almoco") || r.meals.includes("jantar") : r.meals.includes(f));
  const list = RECIPES.filter(match).map((r) => ({ r, miss: r.ing.filter(([id]) => !pantry[id] && !FOODS[id].fixed).map(([id]) => FOODS[id].n), missFixed: r.ing.filter(([id]) => !pantry[id] && FOODS[id].fixed).map(([id]) => FOODS[id].n) })).map((x) => ({ ...x, miss: [...x.miss, ...x.missFixed] })).filter((x) => !only || x.miss.length === 0);
  const [open, setOpen] = useState(null);
  return (<div className="stack">
    <p className="mute">Ideias de pratos com o que você tem. Cada receita mostra as quantidades e os macros de uma porção.</p>
    <div className="chips">{opts.map(([k, l]) => <button key={k} className={"chip sel" + (f === k ? " on" : "")} onClick={() => setF(k)}>{l}</button>)}</div>
    <button className={"crow tnh" + (only ? " on" : "")} aria-pressed={only} onClick={() => setOnly(!only)}><span className="box">{only && <Check size={15} strokeWidth={3.2} />}</span><span className="grow">Mostrar só o que posso fazer agora<small>Usa apenas os alimentos que você marcou</small></span></button>
    {list.length === 0 && <p className="empty">Nenhum prato com os alimentos marcados. Marque mais itens no Mercado.</p>}
    <div className="grid two">
      {list.map(({ r, miss }) => { const m = recipeMacros(r), isOpen = open === r.id; return (
        <section key={r.id} className="card recipe">
          <button className="rec-h" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.id)}>
            <div className="grow"><h2>{r.name}</h2><p className="small mute"><Clock size={12} style={{ verticalAlign: "-1px" }} /> {r.time} min · {r.meals.map((k) => MEAL_LABEL[k]).join(", ")}</p></div>
            <ChevronDown size={20} className={"chev" + (isOpen ? " up" : "")} />
          </button>
          <div className="mpills"><span className="mp p">P {nf(m.p)}</span><span className="mp c">C {nf(m.c)}</span><span className="mp g">G {nf(m.g)}</span><span className="mp k">{nf(m.kcal)} kcal</span></div>
          {miss.length === 0 ? <span className="pill ok mt-s">Você tem tudo</span> : <span className="pill warn mt-s">Falta: {miss.slice(0, 2).join(", ")}{miss.length > 2 ? ` +${miss.length - 2}` : ""}</span>}
          {isOpen && (<div className="rec-b">
            <h3 className="h3">Ingredientes</h3><MealItems items={r.ing} />
            <h3 className="h3">Modo de preparo</h3><ol className="steps">{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            {r.tip && <p className="small mute mt-s"><b>Dica:</b> {r.tip}</p>}
          </div>)}
        </section>); })}
    </div>
  </div>);
}

function Mercado({ ctx }) {
  const { profile, setProfile, date, goal, mealsN } = ctx;
  const pantry = profile.pantry || {}, market = profile.market || {};
  const [open, setOpen] = useState(false), [toast, setToast] = useState("");
  const [f, setF] = useState({ n: "", u: "g", p: "", c: "", g: "", cat: "prot" });
  const toggle = (id) => setProfile((p) => ({ ...p, pantry: { ...(p.pantry || {}), [id]: !(p.pantry || {})[id] } }));
  const toggleM = (id) => setProfile((p) => ({ ...p, market: { ...(p.market || {}), [id]: !(p.market || {})[id] } }));
  const basicMap = Object.fromEntries(BASIC.map((id) => [id, true]));
  const need = weekShopping({ ...basicMap, ...pantry }, goal, date, mealsN), mine = weekShopping(pantry, goal, date, mealsN);
  const foodIds = Object.keys(FOODS).filter((id) => !FOODS[id].pair);
  const count = foodIds.filter((id) => pantry[id]).length;
  const has = (cat, pred = () => true) => Object.keys(FOODS).some((id) => pantry[id] && FOODS[id].cat === cat && pred(FOODS[id]));
  const cov = [["Proteína", has("prot", (x) => !x.pair)], ["Carboidrato", has("carb", (x) => !x.fixed)], ["Vegetais", has("veg")]];
  const baseSecs = [...new Set(MARKET_BASE.map((b) => b.sec))];
  const missing = () => {
    const lines = [];
    SECTIONS.forEach(([sec, label]) => { const its = foodIds.filter((id) => FOODS[id].sec === sec && !pantry[id] && (BASIC.includes(id) || need[id])); if (its.length) { lines.push(`\n${label.toUpperCase()}`); its.forEach((id) => lines.push(`[ ] ${FOODS[id].n}${need[id] ? ": " + need[id].txt : ""}`)); } });
    baseSecs.forEach((s) => { const its = MARKET_BASE.filter((b) => b.sec === s && !market[b.id]); if (its.length) { lines.push(`\n${s.toUpperCase()}`); its.forEach((b) => lines.push(`[ ] ${b.n}: ${b.q}`)); } });
    const tools = MARKET_TOOLS.filter((t) => !market[t.id]); if (tools.length) { lines.push("\nUTENSÍLIOS"); tools.forEach((t) => lines.push(`[ ] ${t.n}`)); }
    return "LISTA DE COMPRAS (7 dias)" + lines.join("\n");
  };
  const copy = async () => { const ok = await copyText(missing()); setToast(ok ? "Lista copiada. Cole no WhatsApp ou nas notas." : "Não consegui copiar. Selecione e copie manualmente."); setTimeout(() => setToast(""), 3500); };
  const addCustom = () => {
    if (!f.n.trim()) return;
    const id = "x_" + f.n.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 20) + "_" + Date.now().toString(36).slice(-4);
    setProfile((p) => ({ ...p, customFood: { ...(p.customFood || {}), [id]: makeCustomFood({ n: f.n.trim(), u: f.u, p: num(f.p), c: num(f.c), g: num(f.g), cat: f.cat }) }, pantry: { ...(p.pantry || {}), [id]: true } }));
    setF({ ...f, n: "", p: "", c: "", g: "" }); setOpen(false);
  };
  const delCustom = (id) => setProfile((p) => { const cf = { ...(p.customFood || {}) }; delete cf[id]; const pa = { ...(p.pantry || {}) }; delete pa[id]; return { ...p, customFood: cf, pantry: pa }; });
  return (<div className="stack">
    <section className="card">
      <div className="row sb"><div><div className="eyebrow">Mercado completo</div><h2>{count} {count === 1 ? "alimento marcado" : "alimentos marcados"}</h2></div><ShoppingBasket size={30} className="acc" /></div>
      <p className="mute mt-s">Marque o que você <b>já comprou</b>. O cardápio usa só esses alimentos. Abaixo de cada item aparece quanto comprar para 7 dias.</p>
      <div className="chips mt">{cov.map(([l, ok]) => <span key={l} className={"chip" + (ok ? " on" : "")}>{ok ? <Check size={14} strokeWidth={3.2} /> : <X size={14} />}{l}</span>)}</div>
      <div className="row mt wrap">
        <button className="btn sm" onClick={copy}><Copy size={16} />Copiar o que falta comprar</button>
        <button className="btn soft sm" onClick={() => setProfile((p) => ({ ...p, pantry: { ...(p.pantry || {}), ...basicMap } }))}>Marcar lista básica</button>
        <button className="btn soft sm" onClick={() => setProfile((p) => ({ ...p, pantry: {}, market: {} }))}>Limpar tudo</button>
      </div>
      {toast && <p className="small ok-line mt-s" role="status">{toast}</p>}
    </section>
    {SECTIONS.map(([sec, label]) => {
      const list = foodIds.filter((id) => FOODS[id].sec === sec); if (!list.length) return null; const n = list.filter((id) => pantry[id]).length;
      return (
        <section key={sec} className="pcat">
          <div className="row sb pcat-h"><h2><i className="cdot" style={{ background: SEC_COLOR[sec] }} />{label}</h2><span className="pill">{n}/{list.length}</span></div>
          <div className="tiles">
            {list.map((id) => { const x = FOODS[id], q = (mine[id] || need[id]); return (
              <div key={id} className="tilewrap">
                <button className={"tile" + (pantry[id] ? " on" : "")} aria-pressed={!!pantry[id]} onClick={() => toggle(id)}>
                  <span className="tile-ck">{pantry[id] && <Check size={13} strokeWidth={3.4} />}</span>
                  <b>{x.n}</b><small>{hint(x)}</small>{q && <em className="tile-q">7 dias: {q.txt}</em>}
                </button>
                {x.custom && <button className="tile-x" aria-label={`Remover ${x.n}`} onClick={() => delCustom(id)}><X size={14} /></button>}
              </div>); })}
          </div>
          {sec === "ovos" && <p className="small mute mt-s">Clara de ovo entra junto com o ovo. <button className="link inl" onClick={() => toggle("clara")}>{pantry.clara ? "Desmarcar clara" : "Marcar clara"}</button></p>}
        </section>);
    })}
    {baseSecs.map((s) => { const its = MARKET_BASE.filter((b) => b.sec === s); return (
      <section key={s} className="card"><div className="row sb"><h2>{s}</h2><span className="pill">{its.filter((b) => market[b.id]).length}/{its.length}</span></div>
        <div className="mt">{its.map((b) => (<button key={b.id} className={"crow" + (market[b.id] ? " on" : "")} aria-pressed={!!market[b.id]} onClick={() => toggleM(b.id)}><span className="box">{market[b.id] && <Check size={15} strokeWidth={3.2} />}</span><span className="grow">{b.n}<small>{b.q}</small></span></button>))}</div></section>); })}
    <section className="card"><div className="row sb"><h2>Utensílios da cozinha</h2><span className="pill">{MARKET_TOOLS.filter((t) => market[t.id]).length}/{MARKET_TOOLS.length}</span></div>
      <div className="mt">{MARKET_TOOLS.map((t) => (<button key={t.id} className={"crow" + (market[t.id] ? " on" : "")} aria-pressed={!!market[t.id]} onClick={() => toggleM(t.id)}><span className="box">{market[t.id] && <Check size={15} strokeWidth={3.2} />}</span><span className="grow">{t.n}{t.note && <small>{t.note}</small>}</span></button>))}</div></section>
    <button className="btn soft" onClick={() => setOpen(true)}><Plus size={18} />Adicionar alimento próprio</button>
    <Sheet open={open} onClose={() => setOpen(false)} title="Alimento próprio">
      <div className="form">
        <p className="mute small">Informe os macros do rótulo, por 100 g ou por unidade.</p>
        <label className="mt-s">Nome<input value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} placeholder="Ex.: Skyr, Coxa desossada" /></label>
        <div className="row-2"><label>Medida<select value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })}><option value="g">Por 100 g</option><option value="un">Por unidade</option></select></label>
          <label>Categoria<select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label></div>
        <div className="row-3">{[["p", "Proteína"], ["c", "Carbo"], ["g", "Gordura"]].map(([k, l]) => <label key={k}>{l} (g)<input inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>)}</div>
        <button className="btn" onClick={addCustom}>Adicionar e marcar</button>
      </div>
    </Sheet>
  </div>);
}

export default function Dieta({ ctx, sub, setSub }) {
  const { goal } = ctx;
  return (
    <main className="page">
      <Header kicker="Meta do dia" title="Dieta" sub={`${goal.kcal} kcal · ${goal.p} g de proteína · ${ctx.mealsN} refeições`} />
      <Seg value={sub} onChange={setSub} options={[["hoje", "Hoje"], ["semana", "Semana"], ["pratos", "Pratos"], ["mercado", "Mercado"]]} />
      {sub === "hoje" && <Hoje ctx={ctx} setSub={setSub} />}
      {sub === "semana" && <Semana ctx={ctx} />}
      {sub === "pratos" && <Pratos ctx={ctx} />}
      {sub === "mercado" && <Mercado ctx={ctx} />}
    </main>
  );
}
