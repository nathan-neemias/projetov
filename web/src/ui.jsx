import React, { useState, useEffect, useRef } from "react";
import { Timer, X, Check } from "lucide-react";
import { mmss } from "./util.js";

export function beep() {
  try { const C = window.AudioContext || window.webkitAudioContext; const ctx = new C(); [0, 0.25, 0.5].forEach((t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.15); }); } catch {}
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {}
}

export function Header({ kicker, title, right, sub }) {
  return (
    <header className="head">
      <div>{kicker && <div className="kicker">{kicker}</div>}<h1 className="title">{title}</h1>{sub && <p className="sub">{sub}</p>}</div>
      {right}
    </header>
  );
}

/* anéis concêntricos (0..1). rings: [{v, color, r}] */
export function Rings({ rings, size = 148, stroke = 11, children }) {
  const c = size / 2;
  return (
    <div className="rings" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        {rings.map((r, i) => {
          const rad = c - stroke / 2 - i * (stroke + 4), len = 2 * Math.PI * rad;
          return (<g key={i} transform={`rotate(-90 ${c} ${c})`}>
            <circle cx={c} cy={c} r={rad} fill="none" stroke={r.color} strokeOpacity=".18" strokeWidth={stroke} />
            {r.v > 0 && <circle cx={c} cy={c} r={rad} fill="none" stroke={r.color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${Math.max(0.001, Math.min(1, r.v)) * len} ${len}`} className="ring-arc" />}
          </g>);
        })}
      </svg>
      <div className="rings-c">{children}</div>
    </div>
  );
}

export function MacroRing({ label, value, goal, unit, color, size = 74 }) {
  const stroke = 8, rad = (size - stroke) / 2, len = 2 * Math.PI * rad, v = Math.min(1, goal ? value / goal : 0), over = goal && value > goal * 1.06;
  return (
    <div className="mring" role="img" aria-label={`${label}: ${Math.round(value)} de ${goal}${unit}`}>
      <div className="mring-svg" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke={over ? "var(--warn)" : color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${Math.max(0.001, v) * len} ${len}`} className="ring-arc" />
          </g>
        </svg>
        <b className="num">{Math.round(value)}</b>
      </div>
      <span className="mring-l">{label}</span><span className="mring-g">de {goal}{unit}</span>
    </div>
  );
}

export function Seg({ value, onChange, options }) {
  return (<div className="seg" role="tablist">{options.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} className={value === k ? "on" : ""} onClick={() => onChange(k)}>{l}</button>)}</div>);
}

export function Bar({ label, value, goal, unit = "", warnOver, color }) {
  const pct = Math.min(100, (value / goal) * 100), over = value > goal * 1.05;
  return (
    <div className="bar">
      <div className="bar-top"><span>{label}</span><span><b className="num">{Math.round(value)}</b> <span className="mute">de {goal}{unit}</span></span></div>
      <div className="track"><div className={"fill" + (over && warnOver ? " warn" : "")} style={{ width: pct + "%", background: over && warnOver ? undefined : color }} /></div>
    </div>
  );
}

export function AreaChart({ series, target, unit = "", height = 180, empty }) {
  const main = series[0].pts;
  if (main.length < 2) return <p className="empty">{empty || "Registre pelo menos 2 medidas para ver o gráfico."}</p>;
  const W = 340, H = height, pl = 36, pr = 10, pt = 12, pb = 24, gid = "g" + Math.abs(Math.round(main[0].y * 7 + main.length));
  const allP = [...series.flatMap((s) => s.pts), ...(target || [])];
  const x0 = Math.min(...allP.map((p) => p.x)), x1 = Math.max(...allP.map((p) => p.x));
  let y0 = Math.min(...allP.map((p) => p.y)), y1 = Math.max(...allP.map((p) => p.y)); if (y1 - y0 < 1) { y0 -= 0.5; y1 += 0.5; }
  const padY = (y1 - y0) * 0.1; y0 -= padY; y1 += padY;
  const px = (x) => pl + ((x - x0) / (x1 - x0 || 1)) * (W - pl - pr), py = (y) => pt + (1 - (y - y0) / (y1 - y0)) * (H - pt - pb);
  const path = (pts) => pts.map((p, i) => (i ? "L" : "M") + px(p.x).toFixed(1) + " " + py(p.y).toFixed(1)).join(" ");
  const area = path(main) + ` L${px(main[main.length - 1].x).toFixed(1)} ${H - pb} L${px(main[0].x).toFixed(1)} ${H - pb} Z`;
  const fmt = (x) => new Date(x).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Gráfico">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--acc)" stopOpacity=".32" /><stop offset="1" stopColor="var(--acc)" stopOpacity="0" /></linearGradient></defs>
      {[y0 + padY, (y0 + y1) / 2, y1 - padY].map((v, i) => <g key={i}><line x1={pl} x2={W - pr} y1={py(v)} y2={py(v)} className="grid" /><text x={pl - 6} y={py(v) + 3} textAnchor="end" className="axis">{v.toFixed(1)}</text></g>)}
      <path d={area} fill={`url(#${gid})`} />
      {target && <path d={path(target)} className="target" />}
      {series.slice(1).map((s, i) => <path key={i} d={path(s.pts)} className="line2" />)}
      <path d={path(main)} className="line" />
      {main.map((p, i) => <circle key={i} cx={px(p.x)} cy={py(p.y)} r={i === main.length - 1 ? 4.5 : 2.6} className="dot" />)}
      <text x={pl} y={H - 6} className="axis">{fmt(x0)}</text><text x={W - pr} y={H - 6} textAnchor="end" className="axis">{fmt(x1)}{unit}</text>
    </svg>
  );
}

export function Check2({ on, onClick, children, className = "" }) {
  return (<button className={"crow " + className + (on ? " on" : "")} onClick={onClick} aria-pressed={!!on}><span className="box">{on && <Check size={15} strokeWidth={3.2} />}</span><span className="grow">{children}</span></button>);
}

export function Tap({ onClick, className = "", pressed, children, label }) {
  const key = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } };
  return <div role="button" tabIndex={0} aria-label={label} aria-pressed={pressed} className={"card tap " + className} onClick={onClick} onKeyDown={key}>{children}</div>;
}

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => { if (!open) return; const k = (e) => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div className="sheet-h"><h2>{title}</h2><button className="icon-btn" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div>
        <div className="sheet-b">{children}</div>
      </div>
    </div>
  );
}

export function RestBar({ rest, setRest }) {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => { fired.current = false; }, [rest && rest.start]);
  useEffect(() => { if (!rest) return; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, [rest]);
  const left = rest ? Math.ceil((rest.end - now) / 1000) : 0;
  useEffect(() => { if (rest && left <= 0 && !fired.current) { fired.current = true; beep(); } }, [left, rest]);
  if (!rest) return null;
  const done = left <= 0, pct = Math.min(1, Math.max(0, (now - rest.start) / (rest.end - rest.start)));
  const r = 20, len = 2 * Math.PI * r;
  return (
    <div className={"rest" + (done ? " done" : "")} role="timer">
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><g transform="rotate(-90 24 24)"><circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="5" /><circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${Math.max(0.001, done ? 1 : pct) * len} ${len}`} /></g></svg>
      <div className="rest-txt"><b className="num">{done ? "Descanso acabou" : mmss(left)}</b><span>{done ? "Hora da próxima série" : rest.label}</span></div>
      {!done && <button className="chip inv" onClick={() => setRest({ ...rest, end: rest.end - 15000 })}>-15 s</button>}
      {!done && <button className="chip inv" onClick={() => setRest({ ...rest, end: rest.end + 15000 })}>+15 s</button>}
      <button className="icon-btn" aria-label="Fechar cronômetro" onClick={() => setRest(null)}><X size={20} /></button>
    </div>
  );
}
export const LineChart = AreaChart;
