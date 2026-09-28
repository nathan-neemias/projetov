import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { House, Dumbbell, Utensils, TrendingUp, BookOpen } from "lucide-react";
import { START, TARGET } from "./data.js";
import { currentUser, loadAll, queueSave, wipe, logout as apiLogout, getUser } from "./store.js";
import Auth from "./Auth.jsx";
import { todayIso, num, addDays } from "./util.js";
import { applyPlan } from "./plan.js";
import { applyFoods, goalOf, generateMenu, seedFor } from "./diet.js";
import Builder from "./Builder.jsx";
import Coach from "./Coach.jsx";
import { Sparkles } from "lucide-react";
import { RestBar } from "./ui.jsx";
import Hoje from "./Hoje.jsx";
import { TreinoHome, Session } from "./Treino.jsx";
import Dieta from "./Dieta.jsx";
import Evolucao from "./Evolucao.jsx";
import Guia, { Onboarding } from "./Guia.jsx";

function useStore() {
  const [ready, setReady] = useState(false), [user, setUser] = useState(null), [save, setSave] = useState("");
  const [state, setState] = useState({ profile: null, days: {}, photos: {} });
  const ref = useRef(state);
  const boot = useCallback(async () => {
    const u = await currentUser(); setUser(u);
    if (u) { try { const s = await loadAll(); ref.current = s; setState(s); } catch { /* sessão expirou */ setUser(null); } }
    setReady(true);
  }, []);
  useEffect(() => { boot(); }, [boot]);
  const commit = useCallback((next, ids) => {
    ref.current = next; setState(next);
    ids.forEach((id) => queueSave(id, id === "profile" ? next.profile : id.startsWith("ph_") ? next.photos[id.slice(3)] : next.days[id.slice(2)], (s) => { setSave(s); if (s === "auth") setUser(null); }));
  }, []);
  const setProfile = useCallback((fn) => commit({ ...ref.current, profile: fn(ref.current.profile || {}) }, ["profile"]), [commit]);
  const setDay = useCallback((date, fn) => commit({ ...ref.current, days: { ...ref.current.days, [date]: fn(ref.current.days[date] || {}) } }, ["d_" + date]), [commit]);
  const setPhoto = useCallback((date, ang, url) => commit({ ...ref.current, photos: { ...ref.current.photos, [date]: { ...(ref.current.photos[date] || {}), [ang]: url } } }, ["ph_" + date]), [commit]);
  const reset = useCallback(async () => { await wipe(); const e = { profile: null, days: {}, photos: {} }; ref.current = e; setState(e); }, []);
  const logout = useCallback(async () => { await apiLogout(); ref.current = { profile: null, days: {}, photos: {} }; setState(ref.current); setUser(null); }, []);
  return { ready, user, mode: "server", save, state, setProfile, setDay, setPhoto, reset, logout, boot };
}

function App() {
  const st = useStore();
  const [tab, setTab] = useState("hoje"), [session, setSession] = useState(null), [rest, setRest] = useState(null), [builder, setBuilder] = useState(false), [coach, setCoach] = useState(null);
  const [subs, setSubs] = useState({ dieta: "hoje", evolucao: "corpo", guia: "plano" });
  const [theme, setThemeS] = useState(() => { try { return localStorage.getItem("projv:theme") || "auto"; } catch { return "auto"; } });
  const date = todayIso();
  useEffect(() => { const r = document.documentElement; theme === "auto" ? r.removeAttribute("data-theme") : r.setAttribute("data-theme", theme); }, [theme]);
  const setTheme = (t) => { setThemeS(t); try { localStorage.setItem("projv:theme", t); } catch {} };
  
  const goTab = (t, sub) => { setSession(null); setBuilder(false); setTab(t); if (sub) setSubs((s) => ({ ...s, [t]: sub })); window.scrollTo(0, 0); };
  const setSub = (t) => (v) => setSubs((s) => ({ ...s, [t]: v }));

  if (!st.ready) return <main className="page welcome"><p className="mute">Carregando seu plano…</p></main>;
  if (!st.user) return <Auth onDone={st.boot} />;
  const { profile, days, photos } = st.state;
  if (!profile || !profile.onboarded) return <Onboarding START={date} TARGET={addDays(date, 91)} num={num} onDone={(p) => st.setProfile((o) => ({ ...o, ...p, onboarded: true }))} />;

  applyPlan(profile); applyFoods(profile);
  const restScale = profile.restScale || 1, autoRest = profile.autoRest !== false;
  const startRest = (sec, label) => { if (!autoRest) return; const s = Math.round((sec * restScale) / 5) * 5, now = Date.now(); setRest({ start: now, end: now + s * 1000, label }); };
  const mealsN = profile.mealsN || 5, goal = goalOf(profile), menu = generateMenu(profile.pantry || {}, goal, seedFor(date, (days[date] || {}).varSeed || 0), mealsN);
  const openSession = (n) => { setBuilder(false); setSession(n); setTab("treino"); window.scrollTo(0, 0); };
  const openBuilder = () => { setSession(null); setTab("treino"); setBuilder(true); window.scrollTo(0, 0); };
  const openCoach = (mode, text) => setCoach({ mode, text: text || "", n: Date.now() });
  const ctx = { openCoach, mealsN, autoRest, restScale, goal, menu, openBuilder, profile, date, days, photos, setDay: st.setDay, setProfile: st.setProfile, setPhoto: st.setPhoto, openSession, goTab, startRest, setRest, rest, mode: st.mode, save: st.save, reset: st.reset, logout: st.logout, user: st.user, theme, setTheme };
  const inSession = tab === "treino" && session;
  let view;
  if (tab === "treino" && builder) view = <Builder ctx={ctx} onClose={() => setBuilder(false)} />;
  else if (inSession) view = <Session key={session} ctx={ctx} planDay={session} onExit={() => setSession(null)} />;
  else if (tab === "treino") view = <TreinoHome ctx={ctx} />;
  else if (tab === "dieta") view = <Dieta ctx={ctx} sub={subs.dieta} setSub={setSub("dieta")} />;
  else if (tab === "evolucao") view = <Evolucao ctx={ctx} sub={subs.evolucao} setSub={setSub("evolucao")} />;
  else if (tab === "guia") view = <Guia ctx={ctx} sub={subs.guia} setSub={setSub("guia")} />;
  else view = <Hoje ctx={ctx} />;

  const focusMode = (inSession && session) || (tab === "treino" && builder);
  const tabs = [["hoje", "Hoje", House], ["treino", "Treino", Dumbbell], ["dieta", "Dieta", Utensils], ["evolucao", "Evolução", TrendingUp], ["guia", "Guia", BookOpen]];
  return (
    <div className={"shell" + ((inSession && session) || (tab === "treino" && builder) ? " focus" : "")}>
      <nav className="nav" aria-label="Navegação principal">
        <div className="brand">Projeto V</div>
        {tabs.map(([k, l, I]) => <button key={k} className={tab === k ? "on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => goTab(k)}><I size={22} /><span>{l}</span></button>)}
      </nav>
      <div className="content">{view}</div>
      {!focusMode && !coach && <button className="fab" aria-label="Abrir o coach" onClick={() => openCoach("personal")}><Sparkles size={22} /><span>Coach</span></button>}
      <Coach key={coach ? coach.n : "closed"} ctx={ctx} open={!!coach} initial={coach} onClose={() => setCoach(null)} />
      <RestBar rest={rest} setRest={setRest} />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
