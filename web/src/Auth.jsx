import React, { useState } from "react";
import BodyMap from "./bodymap.jsx";
import { login, register } from "./store.js";

export default function Auth({ onDone }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ nome: "", email: "", senha: "" });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { mode === "login" ? await login(f.email, f.senha) : await register(f.email, f.senha, f.nome); onDone(); }
    catch (x) { setErr(x.message || "Não foi possível entrar."); } finally { setBusy(false); }
  };
  return (
    <main className="page welcome">
      <section className="w-hero">
        <div className="w-glow" />
        <div className="w-map"><BodyMap primary={["lats", "delt_l", "delt_r", "chest"]} secondary={["traps", "midback", "delt_f"]} compact /></div>
        <h1 className="title big">Projeto V</h1>
        <p className="w-lead">Treino, dieta e evolução com coach de IA, no seu servidor.</p>
      </section>
      <form className="card form" onSubmit={submit}>
        <div className="seg" role="tablist">{[["login", "Entrar"], ["register", "Criar conta"]].map(([k, l]) => <button type="button" key={k} role="tab" aria-selected={mode === k} className={mode === k ? "on" : ""} onClick={() => { setMode(k); setErr(""); }}>{l}</button>)}</div>
        {mode === "register" && <label>Nome<input autoComplete="name" value={f.nome} onChange={set("nome")} /></label>}
        <label>E-mail<input type="email" autoComplete="email" inputMode="email" required value={f.email} onChange={set("email")} /></label>
        <label>Senha{mode === "register" ? " (mínimo 8 caracteres)" : ""}<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 8 : 1} value={f.senha} onChange={set("senha")} /></label>
        {err && <div className="banner" role="alert"><span>{err}</span></div>}
        <button className="btn" disabled={busy}>{busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</button>
      </form>
    </main>
  );
}
