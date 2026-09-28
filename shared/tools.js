import { LIB, LIB_BY_ID } from "./lib.js";

export const MUSCLE_NAME = { chest: "Peito", delt_f: "Ombro frontal", delt_l: "Ombro lateral", delt_r: "Ombro posterior", biceps: "Bíceps", triceps: "Tríceps", forearms: "Antebraço", abs: "Abdômen", obliques: "Oblíquos", traps: "Trapézio", lats: "Dorsal", midback: "Meio das costas", lowback: "Lombar", glutes: "Glúteo", quads: "Quadríceps", hams: "Posterior de coxa", calves: "Panturrilha" };

const obj = (properties, required = []) => ({ type: "object", properties, ...(required.length ? { required } : {}) });
export const TOOL_DEFS = [
  { name: "listar_exercicios", description: "Lista exercícios da biblioteca do app com id, nome, músculo principal e equipamento. Filtre por musculo (chest, lats, midback, traps, delt_f, delt_l, delt_r, biceps, triceps, forearms, quads, hams, glutes, calves, abs, obliques). Use antes de propor uma troca.", input_schema: obj({ musculo: { type: "string" } }) },
  { name: "propor_troca_exercicio", description: "Propõe trocar um exercício do plano por outro em um dia. O usuário decide no botão Aplicar. dia: 1=segunda … 6=sábado. sai_id deve estar no plano atual; entra_id deve existir na biblioteca.", input_schema: obj({ dia: { type: "integer" }, sai_id: { type: "string" }, entra_id: { type: "string" }, motivo: { type: "string" } }, ["dia", "sai_id", "entra_id", "motivo"]) },
  { name: "propor_descanso", description: "Propõe mudar o descanso entre séries de um exercício do plano (segundos, entre 30 e 240).", input_schema: obj({ exercicio_id: { type: "string" }, segundos: { type: "integer" }, motivo: { type: "string" } }, ["exercicio_id", "segundos", "motivo"]) },
  { name: "propor_metas_dieta", description: "Propõe novas metas da dieta. Informe só o que mudar: kcal (1500–6000), proteina_g (60–400), gordura_g (20–200). Nunca proponha abaixo de 1500 kcal.", input_schema: obj({ kcal: { type: "integer" }, proteina_g: { type: "integer" }, gordura_g: { type: "integer" }, motivo: { type: "string" } }, ["motivo"]) },
  { name: "propor_refeicoes_por_dia", description: "Propõe mudar o número de refeições por dia (3 a 6).", input_schema: obj({ n: { type: "integer" }, motivo: { type: "string" } }, ["n", "motivo"]) },
];

/** Executa uma ferramenta. plan = { "1": ["peck", ...], ... } enviado pelo cliente. Lança Error em entrada inválida. */
export function runTool(name, input, plan, addProposal) {
  const int = (v) => Math.round(Number(v));
  const inp = input && typeof input === "object" ? input : {};
  const planIds = new Set(Object.values(plan || {}).flat());
  if (name === "listar_exercicios") {
    const m = String(inp.musculo || "");
    return LIB.filter((e) => !e.rare && (!m || e.pri.includes(m))).slice(0, 30).map((e) => ({ id: e.id, nome: e.name, musculo: e.pri.map((x) => MUSCLE_NAME[x]).join(", "), equipamento: e.eq }));
  }
  if (name === "propor_troca_exercicio") {
    const dia = int(inp.dia), sai = String(inp.sai_id), entra = String(inp.entra_id);
    if (!(plan && Array.isArray(plan[dia]) && plan[dia].includes(sai))) throw new Error("sai_id não está no plano desse dia");
    if (!LIB_BY_ID[entra]) throw new Error("entra_id inválido; use listar_exercicios");
    addProposal({ type: "troca", dia, sai, entra, motivo: String(inp.motivo || "").slice(0, 300) });
    return "Proposta registrada. O usuário vai decidir pelo botão Aplicar.";
  }
  if (name === "propor_descanso") {
    const id = String(inp.exercicio_id), s = int(inp.segundos);
    if (!planIds.has(id)) throw new Error("exercicio_id não está no plano");
    if (!(s >= 30 && s <= 240)) throw new Error("segundos fora de 30–240");
    addProposal({ type: "descanso", id, s, motivo: String(inp.motivo || "").slice(0, 300) });
    return "Proposta registrada.";
  }
  if (name === "propor_metas_dieta") {
    const o = { type: "metas", motivo: String(inp.motivo || "").slice(0, 300) };
    if (inp.kcal != null) { const k = int(inp.kcal); if (!(k >= 1500 && k <= 6000)) throw new Error("kcal fora de 1500–6000"); o.kcal = k; }
    if (inp.proteina_g != null) { const p = int(inp.proteina_g); if (!(p >= 60 && p <= 400)) throw new Error("proteína fora de 60–400"); o.prot = p; }
    if (inp.gordura_g != null) { const g = int(inp.gordura_g); if (!(g >= 20 && g <= 200)) throw new Error("gordura fora de 20–200"); o.fat = g; }
    if (o.kcal == null && o.prot == null && o.fat == null) throw new Error("informe ao menos um valor");
    addProposal(o); return "Proposta registrada.";
  }
  if (name === "propor_refeicoes_por_dia") {
    const n = int(inp.n); if (!(n >= 3 && n <= 6)) throw new Error("n fora de 3–6");
    addProposal({ type: "refeicoes", n, motivo: String(inp.motivo || "").slice(0, 300) }); return "Proposta registrada.";
  }
  throw new Error("ferramenta desconhecida");
}
