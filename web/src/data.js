export const START = "2026-09-28";
export const TARGET = "2026-12-25";
export const DELOAD_WEEK = 7;
export const WATER_GOAL = 3500;

export const MUSCLE_NAME = { chest:"Peito", delt_f:"Ombro frontal", delt_l:"Ombro lateral", delt_r:"Ombro posterior", biceps:"Bíceps", triceps:"Tríceps", forearms:"Antebraço", abs:"Abdômen", obliques:"Oblíquos", traps:"Trapézio", lats:"Dorsal (largura)", midback:"Meio das costas", lowback:"Lombar", glutes:"Glúteo", quads:"Quadríceps", hams:"Posterior de coxa", calves:"Panturrilha" };
export const GROUPS = [
  ["Costas", ["lats", "midback", "traps"]], ["Ombros", ["delt_f", "delt_l", "delt_r"]], ["Peito", ["chest"]],
  ["Bíceps", ["biceps"]], ["Tríceps", ["triceps"]], ["Pernas", ["quads", "hams", "glutes", "calves"]], ["Abdômen", ["abs", "obliques"]],
];

// Registros preenchidos em tempo de execução por applyPlan (plan.js)
export const EX = {};
export const PLAN = {};

export const SUPPS = [
  { id: "creatina", name: "Creatina monohidratada", dose: "3 a 5 g", when: "Todos os dias, em qualquer horário", slot: "Qualquer horário", why: "Mais força, volume muscular e repetições.", ev: "Evidência forte", lvl: 3 },
  { id: "whey", name: "Whey protein", dose: "1 scoop (cerca de 24 g de proteína)", when: "Entra no cardápio (pré-treino e ceia)", slot: "Cardápio", why: "Ajuda a bater a meta de proteína com praticidade.", ev: "Evidência forte", lvl: 3, food: true },
  { id: "cafeina", name: "Cafeína", dose: "100 a 200 mg (máximo cerca de 270 mg)", when: "30 a 45 min antes do treino", slot: "Pré-treino", why: "Mais energia, foco e desempenho.", ev: "Evidência moderada", lvl: 2 },
  { id: "citrulina", name: "Citrulina", dose: "6 a 8 g", when: "30 a 45 min antes do treino", slot: "Pré-treino", why: "Bombeamento e resistência, com efeito pequeno.", ev: "Evidência fraca a moderada", lvl: 1 },
  { id: "omega3", name: "Ômega-3", dose: "1 a 2 g de EPA+DHA", when: "Com uma refeição", slot: "Com refeição", why: "Recuperação e saúde cardiovascular.", ev: "Evidência moderada", lvl: 2 },
  { id: "vitd", name: "Vitamina D", dose: "Conforme o exame de sangue", when: "Com uma refeição que tenha gordura", slot: "Com refeição", why: "Só vale se o exame mostrar nível baixo.", ev: "Depende do exame", lvl: 1 },
  { id: "magnesio", name: "Magnésio glicinato", dose: "200 a 400 mg", when: "À noite", slot: "À noite", why: "Pode ajudar o sono e a recuperação.", ev: "Evidência fraca a moderada", lvl: 1 },
];
export const SUPP_SLOTS = ["Qualquer horário", "Com refeição", "Pré-treino", "À noite"];
export const AVOID = [
  "Queimadores e termogênicos milagrosos: quase sempre é cafeína cara, com risco de taquicardia e insônia.",
  "Anabolizantes, hormônios, SARMs, clenbuterol e diuréticos: risco real para coração, fígado e hormônios. Só com acompanhamento médico.",
  "Chás e detox: perdem líquido, não gordura.",
  "Jejuns extremos e cortes abaixo de 2.200 kcal: você perde músculo e força, o oposto do objetivo.",
];
export const RULES = [
  "Pese os alimentos depois de cozidos e registre tudo no app.",
  "Proteína alta todos os dias, na meta do plano.",
  "Água: 3,5 a 4 L. Fibra: 30 g ou mais.",
  "Zero refrigerante, suco, álcool e ultraprocessados durante a semana.",
  "Sábado é dia de recarga: some cerca de 100 g de carboidrato mantendo a proteína.",
  "Durma 7 a 8 horas. Sono ruim aumenta a fome e reduz a perda de gordura.",
];
export const FAQ = [
  ["Quando o abdômen vai aparecer?", "O abdômen aparece quando o percentual de gordura cai, perto de 12 a 14%. Partindo de 20 a 24%, a meta realista até o fim do plano é chegar a 14 a 16%, com barriga bem mais reta e cintura menor."],
  ["Por que o treino não tem mais abdominal?", "Abdominal não queima a gordura da barriga. O que faz o abdômen aparecer é o déficit calórico. Duas sessões por semana bastam para dar espessura ao músculo."],
  ["O peso subiu, e agora?", "O peso oscila 1 a 2 kg por dia com água, sal e comida no intestino. Olhe a média da semana, a cintura e as fotos, nunca um dia isolado."],
  ["Posso trocar um exercício?", "Pode, se trocar por outro que trabalhe o mesmo músculo e mantenha a progressão de carga. Use o mapa do corpo de cada exercício como guia, ou monte seu treino em Treino > Personalizar."],
  ["A dieta não fecha a meta, o que faço?", "O cardápio só usa o que você marcou no Mercado. Se faltar proteína ou carboidrato, marque mais fontes ou adicione um alimento próprio."],
  ["Estou muito cansado, o que faço?", "Reduza o cardio para 4 a 5 dias antes de cortar comida. Dormir mais e a semana de deload também ajudam."],
];
export const WEEK_FOCUS = { 1: "Ajuste", 2: "Ponto zero: foto e cintura", 3: "Manter", 4: "Avaliação 1", 5: "Manter", 6: "Avaliação 2", 7: "Deload", 8: "Avaliação 3", 9: "Manter", 10: "Avaliação 4", 11: "Manter", 12: "Avaliação 5", 13: "Reta final" };
