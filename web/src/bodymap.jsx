import React from "react";

const ARM = "M56 72 Q42 82 38 110 L34 144 L26 200 L24 214 L44 216 L50 148 L60 112 L66 84 Z";
const TORSO = "M94 54 L66 62 Q56 66 56 80 L62 120 Q68 150 76 176 L74 200 L100 204 L100 54 Z";
const LEG = "M74 198 L100 202 L100 296 L92 356 L72 356 L70 300 Q66 250 74 198 Z";
const BASE = [ARM, TORSO, LEG];

const CALF = "M73 298 Q70 328 76 352 L90 352 Q94 326 92 298 Z";
const ARM_UP = "M48 100 Q42 118 42 140 L54 142 Q60 120 62 100 Z";
const FOREARM = "M42 146 Q36 172 32 200 L44 202 Q52 174 54 146 Z";
const DELT_L = "M52 72 Q44 76 42 92 Q42 102 48 102 Q52 90 54 78 Z";

const FRONT = {
  chest: "M99 68 L99 110 Q80 118 66 104 Q60 84 72 72 Q86 64 99 68 Z",
  delt_f: "M66 68 Q54 70 52 86 Q52 98 60 98 Q68 90 72 76 Z",
  delt_l: DELT_L,
  biceps: ARM_UP,
  forearms: FOREARM,
  abs: "M91 116h8v17h-8z M91 136h8v17h-8z M91 156h8v17h-8z",
  obliques: "M78 118 Q72 146 78 176 L88 178 L88 116 Z",
  quads: "M76 206 Q68 250 72 292 L96 292 Q100 252 99 208 Z",
  calves: CALF,
};
const BACK = {
  traps: "M99 50 L80 64 Q72 70 76 82 Q90 92 99 116 Z",
  delt_r: "M70 66 Q54 68 52 86 Q52 100 62 100 Q70 88 74 74 Z",
  delt_l: DELT_L,
  triceps: ARM_UP,
  forearms: FOREARM,
  lats: "M66 100 Q62 132 78 172 L99 164 L99 122 Q84 112 74 92 Z",
  midback: "M84 96 Q92 100 99 118 L99 150 Q90 146 84 130 Z",
  lowback: "M90 152 L99 152 L99 192 Q94 196 90 190 Z",
  glutes: "M76 196 Q68 218 80 236 Q96 240 99 222 L99 198 Z",
  hams: "M76 242 Q68 272 72 294 L96 294 Q100 270 99 244 Z",
  calves: CALF,
};

const MIRROR = "translate(200 0) scale(-1 1)";
function Sym({ d, cls }) {
  return (<><path d={d} className={cls} /><path d={d} className={cls} transform={MIRROR} /></>);
}
function Figure({ muscles, primary, secondary, x }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <circle cx="100" cy="28" r="16" className="bm-base" />
      <rect x="93" y="40" width="14" height="16" rx="4" className="bm-base" />
      {BASE.map((d, i) => <Sym key={i} d={d} cls="bm-base" />)}
      {Object.entries(muscles).map(([k, d]) => (
        <Sym key={k} d={d} cls={primary.includes(k) ? "bm-pri" : secondary.includes(k) ? "bm-sec" : "bm-off"} />
      ))}
    </g>
  );
}
export const FRONT_KEYS = Object.keys(FRONT), BACK_KEYS = Object.keys(BACK);

export default function BodyMap({ primary = [], secondary = [], compact = false }) {
  const sec = secondary.filter((m) => !primary.includes(m));
  const showFront = [...primary, ...sec].some((m) => m in FRONT), showBack = [...primary, ...sec].some((m) => m in BACK);
  const both = compact ? true : true;
  return (
    <svg viewBox="0 0 400 372" className={"bodymap" + (compact ? " compact" : "")} role="img" aria-label="Mapa dos músculos trabalhados">
      <Figure muscles={FRONT} primary={primary} secondary={sec} x={0} />
      <Figure muscles={BACK} primary={primary} secondary={sec} x={200} />
      <text x="100" y="368" textAnchor="middle" className="bm-lbl">frente</text>
      <text x="300" y="368" textAnchor="middle" className="bm-lbl">costas</text>
    </svg>
  );
}
