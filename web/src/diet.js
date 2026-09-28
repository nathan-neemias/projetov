import { diffDays } from "./util.js";

export const CATS = [["prot", "Proteínas"], ["carb", "Carboidratos"], ["fruta", "Frutas"], ["gord", "Gorduras boas"], ["veg", "Vegetais e legumes"]];
export const SECTIONS = [["carnes", "Açougue e peixaria"], ["ovos", "Ovos e laticínios"], ["frutas", "Hortifruti: frutas"], ["verduras", "Hortifruti: legumes e verduras"], ["graos", "Mercearia: grãos, massas e enlatados"], ["padaria", "Padaria e frios"], ["gorduras", "Gorduras boas"], ["suple", "Suplementos"]];

const H = (one, many, g) => ({ one, many, g });
const F = (n, u, p, c, g, cat, slots, o = {}) => ({ n, u, p, c, g, cat, slots, ...o });
const P = (how, store) => ({ how, store });
const BASE = {
  frango: F("Peito de frango grelhado", "g", 31, 0, 3.6, "prot", ["almoco", "jantar"], { sec: "carnes", step: 10, min: 80, max: 260, yield: 0.72, home: H("filé médio", "filés médios", 90),
    prep: P(["Tempere com sal, alho, limão e páprica por 20 min (ou de um dia para o outro).", "Grelhe em frigideira antiaderente bem quente: 5 a 7 min de cada lado, até não ficar rosado por dentro.", "Descanse 3 min antes de fatiar, assim fica suculento."], "Geladeira até 4 dias; freezer até 3 meses.") }),
  patinho: F("Patinho ou coxão mole", "g", 32, 0, 6, "prot", ["almoco", "jantar"], { sec: "carnes", step: 10, min: 80, max: 260, yield: 0.72, home: H("bife médio", "bifes médios", 90),
    prep: P(["Tempere com sal, alho e pimenta-do-reino.", "Grelhe em frigideira bem quente: 3 a 4 min de cada lado (ao ponto) ou 5 min (bem passado).", "Corte contra a fibra para ficar macio."], "Geladeira até 4 dias; freezer até 3 meses.") }),
  tilapia: F("Tilápia ou pescada", "g", 26, 0, 2.7, "prot", ["almoco", "jantar"], { sec: "carnes", step: 10, min: 80, max: 260, yield: 0.8, home: H("filé médio", "filés médios", 90),
    prep: P(["Tempere com limão, sal e ervas.", "Asse a 200 °C por 15 a 18 min ou grelhe 3 a 4 min de cada lado.", "Está pronto quando desfia fácil com o garfo."], "Geladeira até 2 dias.") }),
  moida: F("Carne moída magra", "g", 27, 0, 9, "prot", ["almoco", "jantar"], { sec: "carnes", step: 10, min: 80, max: 240, yield: 0.72, home: H("colher de servir cheia", "colheres de servir cheias", 50),
    prep: P(["Refogue alho e cebola em fio de azeite (ou seco, na antiaderente).", "Adicione a carne e mexa até secar a água e dourar: 8 a 10 min.", "Escorra o excesso de gordura antes de servir."], "Geladeira até 3 dias; freezer até 3 meses.") }),
  coxa: F("Coxa de frango sem pele", "g", 26, 0, 8.5, "prot", ["almoco", "jantar"], { sec: "carnes", step: 10, min: 80, max: 240, yield: 0.7, home: H("coxa média", "coxas médias", 70),
    prep: P(["Tire a pele e tempere com sal, alho e colorau.", "Asse a 200 °C por 35 a 40 min, virando na metade.", "Está pronta quando o caldo sai claro ao furar."], "Geladeira até 4 dias.") }),
  lombo: F("Lombo suíno magro", "g", 29, 0, 6.5, "prot", ["almoco", "jantar"], { sec: "carnes", step: 10, min: 80, max: 240, yield: 0.72, home: H("fatia média", "fatias médias", 80),
    prep: P(["Tempere e cubra com papel-alumínio.", "Asse a 180 °C por cerca de 40 min (peça de 500 g).", "Fatie fino depois de descansar 10 min."], "Geladeira até 4 dias.") }),
  atum: F("Atum em lata (escorrido)", "g", 26, 0, 1, "prot", ["almoco", "jantar"], { sec: "graos", step: 10, min: 60, max: 170, home: H("lata pequena (escorrida)", "latas pequenas (escorridas)", 120),
    prep: P(["Escorra bem a água da lata (prefira atum em água).", "Misture com limão, cebola picada e salsinha."], "Depois de aberta: até 2 dias em pote, na geladeira.") }),
  sardinha: F("Sardinha em lata (escorrida)", "g", 24, 0, 11, "prot", ["almoco", "jantar"], { sec: "graos", step: 10, min: 60, max: 160, home: H("lata pequena (escorrida)", "latas pequenas (escorridas)", 85),
    prep: P(["Escorra o líquido e esmague com o garfo.", "Sirva com limão, cebola e salsinha, ou no pão integral."], "Depois de aberta: até 2 dias na geladeira.") }),
  peru: F("Peito de peru fatiado", "g", 18, 2, 2, "prot", ["cafe", "pre"], { sec: "padaria", step: 10, min: 40, max: 120, home: H("fatia", "fatias", 15),
    prep: P(["Consuma frio, no pão integral ou enrolado em folhas.", "Prefira o baixo teor de sódio."], "Pacote aberto: até 4 dias.") }),
  ovo: F("Ovo", "un", 6.3, 0.5, 5, "prot", ["cafe", "jantar"], { sec: "ovos", step: 1, min: 2, max: 5, unitName: ["ovo", "ovos"],
    prep: P(["Cozido: 9 a 10 min em água fervente, depois banho de gelo.", "Mexido ou omelete: antiaderente em fogo médio, sem óleo ou com um borrifo de azeite.", "Pochê: 3 min em água quase fervente com um fio de vinagre."], "Cozidos com casca: até 5 dias na geladeira.") }),
  clara: F("Clara de ovo", "un", 3.6, 0.2, 0, "prot", ["cafe"], { sec: "ovos", step: 1, min: 1, max: 6, pair: true, unitName: ["clara", "claras"],
    prep: P(["Misture às claras aos ovos inteiros no omelete ou mexido.", "Guarde as claras sobressalentes em pote, na geladeira, por até 3 dias."], "") }),
  whey: F("Whey protein (scoop de 30 g)", "un", 24, 3, 2, "prot", ["pre", "cafe", "ceia"], { sec: "suple", step: 1, min: 1, max: 2, unitName: ["scoop", "scoops"],
    prep: P(["1 scoop (30 g) em 200 a 250 ml de água gelada ou leite desnatado, no shaker.", "Na vitamina: bata com banana e gelo. No mingau: misture depois de esfriar um pouco."], "") }),
  iogurte: F("Iogurte grego natural", "g", 8, 5, 4, "prot", ["cafe", "pre", "ceia"], { sec: "ovos", step: 10, min: 100, max: 300, home: H("pote de 170 g", "potes de 170 g", 170),
    prep: P(["Prefira natural, sem açúcar. Adoce com fruta picada ou canela.", "Misture aveia e deixe hidratar 5 min para ficar cremoso."], "Fechado, conforme a validade; aberto: 3 dias.") }),
  cottage: F("Queijo cottage", "g", 11, 3.4, 4.3, "prot", ["cafe", "ceia"], { sec: "ovos", step: 10, min: 80, max: 250, home: H("colher de sopa cheia", "colheres de sopa cheias", 30),
    prep: P(["Sirva frio, com fruta, no pão ou na tapioca.", "Tempere com ervas e uma pitada de sal."], "Aberto: até 5 dias.") }),
  ricota: F("Ricota fresca", "g", 11, 3, 8, "prot", ["cafe", "ceia"], { sec: "ovos", step: 10, min: 40, max: 120, home: H("fatia média", "fatias médias", 40),
    prep: P(["Sirva fria no pão integral com tomate e orégano.", "Ou amasse com ervas como patê."], "Aberta: até 4 dias.") }),
  frescal: F("Queijo minas frescal", "g", 17, 3, 14, "prot", ["cafe"], { sec: "ovos", step: 10, min: 30, max: 90, home: H("fatia média", "fatias médias", 30),
    prep: P(["Coma frio no pão ou grelhado por 2 min de cada lado.", "É mais gorduroso: respeite a porção."], "Aberto: até 5 dias.") }),
  leite: F("Leite desnatado", "ml", 3.4, 5, 0.1, "prot", ["cafe"], { sec: "ovos", fixed: 200, home: H("copo americano", "copos americanos", 200),
    prep: P(["Use no café, no mingau de aveia ou na vitamina.", "Aquecido, dissolve melhor a aveia."], "Aberto: 3 dias na geladeira.") }),

  arroz: F("Arroz branco cozido", "g", 2.5, 28, 0.3, "carb", ["almoco", "jantar"], { sec: "graos", step: 10, min: 100, max: 350, yield: 2.2, home: H("colher de servir cheia", "colheres de servir cheias", 60),
    prep: P(["Lave 1 xícara de arroz cru. Refogue 1 dente de alho, junte 2 xícaras de água quente e sal.", "Cozinhe tampado em fogo baixo por 15 a 18 min, até secar. Deixe abafado 5 min.", "1 xícara de arroz cru rende cerca de 3 xícaras cozidas."], "Geladeira até 4 dias; congele em porções de 150 g.") }),
  arroz_int: F("Arroz integral cozido", "g", 2.6, 25.8, 1, "carb", ["almoco", "jantar"], { sec: "graos", step: 10, min: 100, max: 350, yield: 2.4, home: H("colher de servir cheia", "colheres de servir cheias", 55),
    prep: P(["Use 1 parte de arroz para 2,5 de água, com sal.", "Cozinhe tampado em fogo baixo por 30 a 35 min.", "Deixe abafado 10 min antes de soltar com o garfo."], "Geladeira até 4 dias; congela bem.") }),
  batata_doce: F("Batata-doce cozida", "g", 1.5, 20, 0.1, "carb", ["almoco", "jantar", "pre"], { sec: "verduras", step: 10, min: 100, max: 400, yield: 0.95, home: H("batata-doce média", "batatas-doces médias", 110),
    prep: P(["Cozida: 20 a 25 min em água fervente com casca (12 min na panela de pressão).", "Assada: 200 °C por 40 min. Air fryer: 200 °C por 25 a 30 min, inteira.", "Pode amassar como purê, sem manteiga."], "Geladeira até 4 dias.") }),
  batata: F("Batata inglesa cozida", "g", 2, 17, 0.1, "carb", ["almoco", "jantar"], { sec: "verduras", step: 10, min: 100, max: 400, yield: 0.95, home: H("batata média", "batatas médias", 110),
    prep: P(["Cozinhe com casca por 20 a 25 min, ou asse a 200 °C por 40 min.", "Tempere com sal, alho e alecrim; evite fritar."], "Geladeira até 4 dias.") }),
  inhame: F("Inhame cozido", "g", 1.5, 23, 0.1, "carb", ["almoco", "jantar"], { sec: "verduras", step: 10, min: 100, max: 300, yield: 0.95, home: H("pedaço médio", "pedaços médios", 80),
    prep: P(["Descasque e cozinhe em água com sal por 20 a 25 min, até macio no garfo."], "Geladeira até 4 dias.") }),
  mandioca: F("Mandioca cozida", "g", 1.4, 30, 0.3, "carb", ["almoco", "jantar", "cafe"], { sec: "verduras", step: 10, min: 100, max: 300, yield: 0.95, home: H("pedaço médio", "pedaços médios", 70),
    prep: P(["Cozinhe em água com sal: 25 min na panela de pressão, 40 min na comum.", "Retire o talo fibroso do meio antes de servir."], "Geladeira até 4 dias.") }),
  macarrao: F("Macarrão cozido", "g", 5, 31, 1, "carb", ["almoco", "jantar"], { sec: "graos", step: 10, min: 100, max: 300, yield: 2.4, home: H("pegador cheio", "pegadores cheios", 110),
    prep: P(["Água com sal; cozinhe no tempo do pacote menos 1 min (al dente).", "Escorra e regue com um fio de azeite para não grudar.", "100 g de macarrão cru rendem cerca de 240 g cozidos."], "Geladeira até 3 dias.") }),
  quinoa: F("Quinoa cozida", "g", 4.4, 21, 1.9, "carb", ["almoco", "jantar"], { sec: "graos", step: 10, min: 100, max: 300, yield: 2.8, home: H("colher de servir cheia", "colheres de servir cheias", 60),
    prep: P(["Lave bem em peneira para tirar o amargor.", "Cozinhe 1 parte de quinoa para 2 de água por 12 a 15 min."], "Geladeira até 4 dias.") }),
  aveia: F("Aveia em flocos", "g", 14, 66, 7, "carb", ["cafe", "pre"], { sec: "graos", step: 10, min: 30, max: 100, home: H("colher de sopa cheia", "colheres de sopa cheias", 15),
    prep: P(["Mingau: 3 min no micro-ondas com leite ou água.", "Ou misture crua no iogurte e deixe hidratar 5 min."], "Pote fechado, local seco, até 6 meses.") }),
  pao: F("Pão integral (fatia)", "un", 4, 12, 1, "carb", ["cafe", "pre"], { sec: "padaria", step: 1, min: 1, max: 4, unitName: ["fatia", "fatias"],
    prep: P(["Toste na torradeira ou sanduicheira.", "Confira o rótulo: farinha integral como 1º ingrediente."], "Congele fatiado; toste sem descongelar.") }),
  pao_frances: F("Pão francês", "un", 4.5, 29, 1.6, "carb", ["cafe"], { sec: "padaria", step: 1, min: 1, max: 2, unitName: ["pão", "pães"],
    prep: P(["Retire o miolo se quiser menos carboidrato; recheie com ovo e queijo cottage.", "Toste 2 min na frigideira."], "Consuma no dia; congele o que sobrar.") }),
  tapioca: F("Tapioca (goma seca)", "g", 0, 88, 0, "carb", ["cafe", "pre"], { sec: "graos", step: 10, min: 20, max: 60, home: H("colher de sopa cheia", "colheres de sopa cheias", 12),
    prep: P(["Espalhe a goma hidratada em frigideira antiaderente quente, sem óleo.", "Vire quando soltar; recheie e dobre em 1 a 2 min."], "Goma seca em pote fechado.") }),
  cuscuz: F("Cuscuz de milho cozido", "g", 2.2, 25, 0.7, "carb", ["cafe"], { sec: "graos", step: 10, min: 100, max: 250, home: H("fatia média", "fatias médias", 100),
    prep: P(["Hidrate a massa com água e uma pitada de sal.", "Cozinhe no vapor por 10 a 12 min."], "Geladeira até 3 dias.") }),
  feijao: F("Feijão cozido", "g", 5, 14, 0.5, "carb", ["almoco"], { sec: "graos", fixed: 100, home: H("concha média (grãos)", "conchas médias (grãos)", 100),
    prep: P(["Deixe de molho por 8 h e troque a água.", "Cozinhe na panela de pressão por 25 a 30 min com louro, alho e cebola.", "Sirva sem bacon e sem linguiça."], "Geladeira até 4 dias; freezer até 3 meses em porções.") }),
  lentilha: F("Lentilha cozida", "g", 9, 20, 0.4, "carb", ["almoco"], { sec: "graos", fixed: 100, home: H("concha média (grãos)", "conchas médias (grãos)", 100),
    prep: P(["Sem molho: cozinhe 20 a 25 min com louro e alho.", "Tempere no final para não endurecer."], "Geladeira até 4 dias.") }),

  banana: F("Banana", "un", 1.3, 27, 0.3, "fruta", ["cafe", "pre", "ceia"], { sec: "frutas", fixed: 1, unitName: ["banana", "bananas"], prep: P(["Consuma fresca. Mais madura, mais doce; mais verde, mais fibra."], "") }),
  maca: F("Maçã", "un", 0.5, 20, 0.3, "fruta", ["cafe", "pre"], { sec: "frutas", fixed: 1, unitName: ["maçã", "maçãs"], prep: P(["Lave e coma com casca, onde está a fibra."], "") }),
  laranja: F("Laranja", "un", 1, 15, 0.2, "fruta", ["cafe", "pre"], { sec: "frutas", fixed: 1, unitName: ["laranja", "laranjas"], prep: P(["Coma em gomos; o suco tira a fibra e concentra o açúcar."], "") }),
  mamao: F("Mamão", "g", 0.5, 11, 0.1, "fruta", ["cafe", "ceia"], { sec: "frutas", fixed: 150, home: H("fatia média", "fatias médias", 150), prep: P(["Retire as sementes e sirva gelado com um fio de limão."], "") }),
  morango: F("Morango", "g", 0.7, 7.7, 0.3, "fruta", ["cafe", "pre", "ceia"], { sec: "frutas", fixed: 150, home: H("xícara", "xícaras", 150), prep: P(["Lave só na hora de comer e retire as folhas."], "") }),
  abacaxi: F("Abacaxi", "g", 0.5, 12.3, 0.1, "fruta", ["cafe", "pre"], { sec: "frutas", fixed: 150, home: H("fatia média", "fatias médias", 75), prep: P(["Sirva gelado; ajuda na digestão de refeições ricas em proteína."], "") }),
  uva: F("Uva", "g", 0.7, 17, 0.2, "fruta", ["pre"], { sec: "frutas", fixed: 100, home: H("cacho pequeno", "cachos pequenos", 100), prep: P(["Lave bem antes de comer."], "") }),
  melancia: F("Melancia", "g", 0.6, 8, 0.2, "fruta", ["pre", "ceia"], { sec: "frutas", fixed: 250, home: H("fatia média", "fatias médias", 250), prep: P(["Sirva gelada, boa para hidratar."], "") }),
  manga: F("Manga", "g", 0.8, 15, 0.4, "fruta", ["cafe", "pre"], { sec: "frutas", fixed: 120, home: H("fatia média", "fatias médias", 120), prep: P(["Coma em pedaços; controle a porção por ser mais calórica."], "") }),

  azeite: F("Azeite de oliva", "col", 0, 0, 13.5, "gord", ["almoco", "jantar"], { sec: "gorduras", fixed: 1,
    prep: P(["Use cru sobre a salada ou no final do preparo. 1 colher de sopa = cerca de 13 g.", "Para cozinhar, prefira um borrifador e use bem pouco."], "Longe da luz e do calor.") }),
  pasta: F("Pasta de amendoim", "col", 3.8, 3, 7.5, "gord", ["ceia"], { sec: "gorduras", step: 1, min: 1, max: 3,
    prep: P(["Escolha 100% amendoim, sem açúcar nem óleo vegetal.", "Espalhe no pão ou misture no iogurte."], "Temperatura ambiente ou geladeira.") }),
  castanha: F("Castanhas", "g", 15, 15, 58, "gord", ["ceia"], { sec: "gorduras", step: 5, min: 10, max: 40, home: H("punhado pequeno", "punhados pequenos", 20),
    prep: P(["Porção de 1 punhado pequeno (cerca de 20 g).", "Prefira sem sal e sem açúcar."], "Pote fechado, local fresco.") }),
  amendoim: F("Amendoim torrado", "g", 26, 16, 49, "gord", ["ceia"], { sec: "gorduras", step: 5, min: 10, max: 30, home: H("punhado pequeno", "punhados pequenos", 20),
    prep: P(["Prefira sem sal e sem casca açucarada."], "Pote fechado.") }),
  abacate: F("Abacate", "g", 2, 9, 15, "gord", ["ceia"], { sec: "gorduras", step: 10, min: 40, max: 150, home: H("colher de sopa cheia", "colheres de sopa cheias", 30),
    prep: P(["Amasse com limão e sal, ou coma em fatias.", "Gordura boa, mas calórica: respeite a colher."], "Aberto: cubra com limão e filme, 1 dia.") }),

  salada: F("Salada de folhas", "livre", 0, 0, 0, "veg", ["almoco", "jantar"], { sec: "verduras", fixed: 1,
    prep: P(["Lave, seque bem e monte com alface, rúcula e tomate.", "Tempere com limão, sal e um fio de azeite."], "Folhas secas em pote com papel toalha: 4 dias.") }),
  legumes: F("Legumes cozidos (cenoura, abobrinha, chuchu)", "g", 2, 6, 0.2, "veg", ["almoco", "jantar"], { sec: "verduras", fixed: 150, home: H("colher de servir", "colheres de servir", 40),
    prep: P(["Vapor por 5 a 8 min ou refogue rápido (al dente) com alho.", "Não cozinhe demais para manter fibras e cor."], "Geladeira até 3 dias.") }),
  brocolis: F("Brócolis cozido", "g", 2.8, 7, 0.4, "veg", ["almoco", "jantar"], { sec: "verduras", fixed: 120, home: H("ramo médio", "ramos médios", 30),
    prep: P(["Vapor por 4 a 5 min, até ficar verde vivo.", "Tempere com limão e alho."], "Geladeira até 3 dias.") }),
  couve_flor: F("Couve-flor cozida", "g", 2, 4, 0.3, "veg", ["almoco", "jantar"], { sec: "verduras", fixed: 120, home: H("ramo médio", "ramos médios", 40),
    prep: P(["Vapor por 6 a 8 min ou asse a 200 °C por 20 min com alho."], "Geladeira até 3 dias.") }),
  vagem: F("Vagem cozida", "g", 1.8, 5, 0.2, "veg", ["almoco", "jantar"], { sec: "verduras", fixed: 100, home: H("colher de servir", "colheres de servir", 35),
    prep: P(["Cozinhe 5 min em água fervente e passe em água gelada."], "Geladeira até 3 dias.") }),
  tomate: F("Tomate", "g", 0.9, 3.9, 0.2, "veg", ["almoco", "jantar"], { sec: "verduras", fixed: 100, home: H("tomate médio", "tomates médios", 100),
    prep: P(["Fatie na salada com sal e orégano."], "") }),
};
export const FOODS = { ...BASE };
export const BASIC = ["frango", "patinho", "ovo", "clara", "whey", "iogurte", "arroz", "batata_doce", "aveia", "pao", "feijao", "banana", "maca", "azeite", "pasta", "salada", "legumes"];

/* itens de mercado sem macros relevantes: temperos, básicos e utensílios */
export const MARKET_BASE = [
  { id: "m_sal", n: "Sal", sec: "Temperos e básicos", q: "1 pacote" }, { id: "m_alho", n: "Alho", sec: "Temperos e básicos", q: "2 cabeças" },
  { id: "m_cebola", n: "Cebola", sec: "Temperos e básicos", q: "1 kg" }, { id: "m_limao", n: "Limão", sec: "Temperos e básicos", q: "6 unidades" },
  { id: "m_pimenta", n: "Pimenta-do-reino", sec: "Temperos e básicos", q: "1 pote" }, { id: "m_oregano", n: "Orégano", sec: "Temperos e básicos", q: "1 pote" },
  { id: "m_paprica", n: "Páprica (doce ou defumada)", sec: "Temperos e básicos", q: "1 pote" }, { id: "m_cominho", n: "Cominho", sec: "Temperos e básicos", q: "1 pote" },
  { id: "m_colorau", n: "Colorau", sec: "Temperos e básicos", q: "1 pote" }, { id: "m_curcuma", n: "Cúrcuma (açafrão)", sec: "Temperos e básicos", q: "1 pote" },
  { id: "m_cheiro", n: "Salsinha e cebolinha", sec: "Temperos e básicos", q: "1 maço" }, { id: "m_louro", n: "Folhas de louro", sec: "Temperos e básicos", q: "1 pacote" },
  { id: "m_canela", n: "Canela em pó", sec: "Temperos e básicos", q: "1 pote" }, { id: "m_vinagre", n: "Vinagre de maçã ou balsâmico", sec: "Temperos e básicos", q: "1 frasco" },
  { id: "m_shoyu", n: "Molho shoyu light", sec: "Temperos e básicos", q: "1 frasco" }, { id: "m_mostarda", n: "Mostarda", sec: "Temperos e básicos", q: "1 frasco" },
  { id: "m_molho", n: "Molho de tomate sem açúcar / polpa de tomate", sec: "Temperos e básicos", q: "4 unidades" }, { id: "m_adocante", n: "Adoçante (stevia ou xilitol)", sec: "Temperos e básicos", q: "1 frasco" },
  { id: "m_cafe", n: "Café", sec: "Bebidas", q: "500 g" }, { id: "m_cha", n: "Chás (camomila, hibisco, mate)", sec: "Bebidas", q: "2 caixas" }, { id: "m_agua", n: "Água mineral (se não filtra em casa)", sec: "Bebidas", q: "conforme a meta de 3,5 L" },
];
export const MARKET_TOOLS = [
  { id: "u_balanca", n: "Balança de cozinha (digital)", note: "Essencial: pese os alimentos já cozidos." }, { id: "u_marmita", n: "Marmitas herméticas (12 a 15)", note: "Vidro ou plástico livre de BPA, que vá ao micro-ondas." },
  { id: "u_colher", n: "Colheres e copo medidores", note: "Ajudam quando não há balança." }, { id: "u_garrafa", n: "Garrafa de 2 litros", note: "Marque os horários para bater a meta de água." },
  { id: "u_pressao", n: "Panela de pressão", note: "Feijão e mandioca em 25 min." }, { id: "u_frigideira", n: "Frigideira antiaderente", note: "Grelha sem precisar de óleo." },
  { id: "u_assadeira", n: "Assadeira + papel-manteiga", note: "Para peixe, frango e batata-doce no forno." }, { id: "u_potes", n: "Potes para congelar porções", note: "Arroz, feijão e carnes em porções." },
  { id: "u_faca", n: "Faca boa e tábua de corte", note: "" }, { id: "u_airfryer", n: "Air fryer (opcional)", note: "Crocância sem fritura." }, { id: "u_shaker", n: "Shaker", note: "Para o whey." },
];

export function applyFoods(profile) {
  Object.keys(FOODS).forEach((k) => { if (!(k in BASE)) delete FOODS[k]; });
  Object.entries((profile && profile.customFood) || {}).forEach(([id, f]) => { FOODS[id] = f; });
}
export function makeCustomFood({ n, u, p, c, g, cat }) {
  const slots = { prot: ["almoco", "jantar"], carb: ["almoco", "jantar"], fruta: ["cafe", "pre", "ceia"], gord: ["ceia"], veg: ["almoco", "jantar"] }[cat];
  const o = { sec: { prot: "carnes", carb: "graos", fruta: "frutas", gord: "gorduras", veg: "verduras" }[cat] };
  if (cat === "prot" || cat === "carb") Object.assign(o, u === "g" ? { step: 10, min: 50, max: 300 } : { step: 1, min: 1, max: 4 });
  else if (cat === "gord") Object.assign(o, u === "g" ? { step: 5, min: 10, max: 40 } : { step: 1, min: 1, max: 3 });
  else o.fixed = u === "g" ? 100 : 1;
  return F(n, u, p, c, g, cat, slots, { ...o, custom: true, prep: { how: ["Preparo livre. Pese o alimento pronto na balança."], store: "" } });
}
export const goalOf = (p) => { const kcal = (p && p.kcal) || 2450, prot = (p && p.prot) || 200, fat = (p && p.fat) || 70; return { kcal, p: prot, g: fat, c: Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4)) }; };

const per100 = (f) => f.u === "g" || f.u === "ml";
const mac = (id, q) => { const f = FOODS[id]; if (!f) return { p: 0, c: 0, g: 0 }; const k = per100(f) ? q / 100 : f.u === "livre" ? 0 : q; return { p: f.p * k, c: f.c * k, g: f.g * k }; };
export const itemMacros = ([id, q]) => mac(id, q);
export const sumMacros = (items) => items.reduce((a, it) => { const x = mac(it[0], it[1]); return { p: a.p + x.p, c: a.c + x.c, g: a.g + x.g }; }, { p: 0, c: 0, g: 0 });
export const kcalOf = (m) => m.p * 4 + m.c * 4 + m.g * 9;
export const seedFor = (date, bump = 0) => diffDays("2026-01-01", date) + bump;

/* ---- medidas caseiras ---- */
const frac = (r) => { const w = Math.floor(r), h = r - w >= 0.5; return w === 0 ? "½" : h ? `${w}½` : String(w); };
export function fmtQty(id, q) {
  const f = FOODS[id]; if (!f) return String(q);
  if (per100(f)) return `${q} ${f.u === "ml" ? "ml" : "g"}`;
  if (f.u === "col") return `${q} col. de sopa`;
  if (f.u === "livre") return "à vontade";
  return `${q} ${q === 1 ? (f.unitName ? f.unitName[0] : "unidade") : (f.unitName ? f.unitName[1] : "unidades")}`;
}
export function homeQty(id, q) {
  const f = FOODS[id]; if (!f) return null;
  if (f.u === "livre") return { main: "à vontade", sub: "1 prato de sobremesa cheio" };
  if (f.u === "col") return { main: `${q} ${q === 1 ? "colher" : "colheres"} de sopa`, sub: `≈ ${Math.round(q * (id === "azeite" ? 13 : 17))} g` };
  if (!per100(f)) return { main: fmtQty(id, q), sub: id === "whey" ? `${q * 30} g de pó` : f.u === "un" && id === "ovo" ? `≈ ${q * 50} g` : "" };
  const raw = f.yield ? `cru: ${Math.round(q / f.yield)} g` : "";
  if (!f.home) return { main: fmtQty(id, q), sub: raw };
  const r = Math.max(0.5, Math.round((q / f.home.g) * 2) / 2);
  return { main: `${frac(r)} ${r === 1 ? f.home.one : f.home.many}`, sub: `${q} ${f.u === "ml" ? "ml" : "g"} ${f.yield ? "cozido" : ""}${raw ? ` · ${raw}` : ""}`.trim() };
}

/* ---- refeições por dia ---- */
const D = (k, name, time, slot, roles, sp, sc) => ({ k, name, time, slot, roles, sp, sc });
export const MEAL_PLANS = {
  3: { label: "3 refeições", perMeal: "50 a 65 g", note: "Poucas refeições grandes. Cada uma precisa de bastante proteína; funciona bem se a rotina é corrida. Treine de 2 a 3 h depois do almoço.",
    defs: [D("cafe", "Café da manhã", "7h", "cafe", ["prot", "carb", "fruta"], 0.28, 0.3), D("almoco", "Almoço", "12h30", "almoco", ["prot", "carb", "fixed"], 0.4, 0.4), D("jantar", "Jantar", "19h30", "jantar", ["prot", "carb", "fixed"], 0.32, 0.3)] },
  4: { label: "4 refeições", perMeal: "45 a 55 g", note: "Café, almoço, lanche da tarde (pré-treino) e jantar. Boa divisão para quem tem pouco tempo entre as refeições.",
    defs: [D("cafe", "Café da manhã", "7h", "cafe", ["prot", "carb", "fruta"], 0.22, 0.24), D("almoco", "Almoço", "12h", "almoco", ["prot", "carb", "fixed"], 0.32, 0.32), D("pre", "Lanche da tarde (pré-treino)", "1h30 antes do treino", "pre", ["prot", "carb", "fruta"], 0.16, 0.18), D("jantar", "Jantar e pós-treino", "até 1h depois do treino", "jantar", ["prot", "carb", "fixed"], 0.3, 0.26)] },
  5: { label: "5 refeições", perMeal: "35 a 50 g", note: "Recomendado. Proteína a cada 3 ou 4 horas, pré-treino para render mais e ceia para não passar a noite em jejum.",
    defs: [D("cafe", "Café da manhã", "7h", "cafe", ["prot", "carb", "fruta"], 0.2, 0.26), D("almoco", "Almoço", "12h", "almoco", ["prot", "carb", "fixed"], 0.28, 0.28), D("pre", "Pré-treino", "1h30 antes do treino", "pre", ["prot", "carb", "fruta"], 0.16, 0.18), D("jantar", "Jantar e pós-treino", "até 1h depois do treino", "jantar", ["prot", "carb", "fixed"], 0.26, 0.22), D("ceia", "Ceia", "1h antes de dormir", "ceia", ["prot", "gord", "fruta"], 0.1, 0.06)] },
  6: { label: "6 refeições", perMeal: "30 a 40 g", note: "Doses menores e mais frequentes. Bom para quem tem apetite baixo ou treina cedo e precisa comer de pouco em pouco.",
    defs: [D("cafe", "Café da manhã", "7h", "cafe", ["prot", "carb", "fruta"], 0.16, 0.2), D("lanche", "Lanche da manhã", "10h", "pre", ["prot", "fruta"], 0.12, 0.1), D("almoco", "Almoço", "12h30", "almoco", ["prot", "carb", "fixed"], 0.24, 0.26), D("pre", "Pré-treino", "1h30 antes do treino", "pre", ["prot", "carb", "fruta"], 0.16, 0.18), D("jantar", "Jantar e pós-treino", "até 1h depois do treino", "jantar", ["prot", "carb", "fixed"], 0.24, 0.2), D("ceia", "Ceia", "1h antes de dormir", "ceia", ["prot", "gord", "fruta"], 0.08, 0.06)] },
};
const OFFK = { cafe: 0, lanche: 1, almoco: 1, pre: 0, jantar: 2, ceia: 0 };
const fit = (f, q) => { const st = f.step || 1; q = Math.round(q / st) * st; return Math.min(f.max ?? Infinity, Math.max(f.min ?? st, q)); };
const perMacro = (f, m) => (per100(f) ? f[m] / 100 : f[m]);

export function generateMenu(pantry, goal, seed = 0, mealsN = 5) {
  const plan = MEAL_PLANS[mealsN] || MEAL_PLANS[5];
  const ids = Object.keys(FOODS).filter((id) => pantry && pantry[id]);
  const hasProt = ids.some((id) => FOODS[id].cat === "prot" && !FOODS[id].pair && !FOODS[id].fixed), hasCarb = ids.some((id) => FOODS[id].cat === "carb" && !FOODS[id].fixed);
  if (!hasProt && !hasCarb) return { empty: true, meals: [], totals: { p: 0, c: 0, g: 0, kcal: 0 }, warnings: [], plan };
  const owned = (slot, cat, pred = () => true) => ids.filter((id) => { const f = FOODS[id]; return f.cat === cat && f.slots.includes(slot) && !f.pair && pred(f); });
  const pick = (list, k) => (list.length ? list[(((seed + k) % list.length) + list.length) % list.length] : null);
  const meals = plan.defs.map((def, mi) => {
    const items = [], R = def.roles, slot = def.slot, off = OFFK[def.k] || 0;
    if (R.includes("prot")) {
      const pid = pick(owned(slot, "prot", (f) => !f.fixed), off + mi);
      if (pid) { items.push({ id: pid, role: "prot" }); if (pid === "ovo" && pantry.clara) items.push({ id: "clara", role: "prot" }); }
    }
    if (R.includes("carb")) { const cid = pick(owned(slot, "carb", (f) => !f.fixed), off + mi + 1); if (cid) items.push({ id: cid, role: "carb" }); }
    if (R.includes("fruta")) { const fid = pick(owned(slot, "fruta"), mi + seed); if (fid) items.push({ id: fid, role: "fixed", q: FOODS[fid].fixed }); }
    if (R.includes("gord")) { const gid = pick(owned(slot, "gord", (f) => !f.fixed), 0); if (gid) items.push({ id: gid, role: "gord" }); }
    const fixedOf = (cat) => ids.filter((id) => FOODS[id].fixed && FOODS[id].cat === cat && FOODS[id].slots.includes(slot));
    if (R.includes("fixed")) {
      const veg = fixedOf("veg"), legs = fixedOf("carb"), oil = fixedOf("gord");
      const salad = veg.filter((id) => id === "salada"), others = veg.filter((id) => id !== "salada");
      const chosenVeg = [...salad, ...[pick(others, mi + seed), pick(others, mi + seed + 1)].filter((x, i, a) => x && a.indexOf(x) === i)].slice(0, 3);
      chosenVeg.forEach((id) => items.push({ id, role: "fixed", q: FOODS[id].fixed }));
      const lg = pick(legs, seed); if (lg) items.push({ id: lg, role: "fixed", q: FOODS[lg].fixed });
      oil.forEach((id) => items.push({ id, role: "fixed", q: FOODS[id].fixed }));
    }
    if (R.includes("prot")) fixedOf("prot").forEach((id) => items.push({ id, role: "fixed", q: FOODS[id].fixed }));
    const pi = items.filter((x) => x.role === "prot"), ci = items.filter((x) => x.role === "carb");
    pi.forEach((x) => { const w = pi.length === 2 ? (x.id === "ovo" ? 0.65 : 0.35) : 1; x.q = ((goal.p * def.sp * w) / perMacro(FOODS[x.id], "p")) || 1; });
    ci.forEach((x) => { const f = FOODS[x.id]; x.q = f.c > 0 ? (goal.c * def.sc) / perMacro(f, "c") : f.min || 1; });
    items.filter((x) => x.role === "gord").forEach((x) => { x.q = FOODS[x.id].min || 1; });
    return { def, items };
  });
  const all = () => meals.flatMap((m) => m.items);
  const tot = () => all().reduce((a, x) => { const k = mac(x.id, x.q); return { p: a.p + k.p, c: a.c + k.c, g: a.g + k.g }; }, { p: 0, c: 0, g: 0 });
  const roleSum = (role, m) => all().filter((x) => x.role === role).reduce((a, x) => a + mac(x.id, x.q)[m], 0);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const roundAll = () => all().forEach((x) => { if (x.role !== "fixed") x.q = fit(FOODS[x.id], x.q); });
  for (let it = 0; it < 10; it++) {
    roundAll(); let t = tot(); const sp = roleSum("prot", "p");
    if (sp > 0) { const m = clamp(1 + (goal.p - t.p) / sp, 0.6, 1.8); all().filter((x) => x.role === "prot").forEach((x) => { x.q *= m; }); }
    roundAll(); t = tot(); const sc = roleSum("carb", "c");
    if (sc > 0) { const cT = 0.5 * goal.c + 0.5 * ((goal.kcal - t.p * 4 - t.g * 9) / 4); const m = clamp(1 + (cT - t.c) / sc, 0.6, 1.8); all().filter((x) => x.role === "carb").forEach((x) => { x.q *= m; }); }
    roundAll(); t = tot(); const sg = roleSum("gord", "g");
    if (sg > 0) { const m = clamp(1 + (goal.g - t.g) / sg, 0.4, 2.5); all().filter((x) => x.role === "gord").forEach((x) => { x.q *= m; }); }
  }
  roundAll();
  const out = meals.map(({ def, items }) => { const its = items.map((x) => [x.id, x.q]), m = sumMacros(its); return { key: def.k, name: def.name, time: def.time, items: its, p: m.p, c: m.c, g: m.g, kcal: kcalOf(m) }; }).filter((m) => m.items.length);
  const totals = out.reduce((a, m) => ({ p: a.p + m.p, c: a.c + m.c, g: a.g + m.g }), { p: 0, c: 0, g: 0 }); totals.kcal = kcalOf(totals);
  const warnings = [];
  if (totals.p < goal.p * 0.92) warnings.push(`Com os alimentos marcados o cardápio chega a ${Math.round(totals.p)} g de proteína, e a meta é ${goal.p} g. Marque mais fontes de proteína (frango, ovos, whey, iogurte grego...).`);
  if (totals.c < goal.c * 0.88) warnings.push(`Faltam cerca de ${Math.round(goal.c - totals.c)} g de carboidrato. Marque mais fontes (arroz, batata-doce, aveia, pão...).`);
  if (totals.kcal > goal.kcal * 1.07) warnings.push(`O cardápio ficou ${Math.round(totals.kcal - goal.kcal)} kcal acima da meta. Reduza alguma fonte de gordura ou ajuste a meta em Guia > Ajustes.`);
  if (!hasProt) warnings.push("Você não marcou nenhuma proteína. Marque pelo menos uma no Mercado.");
  if (!hasCarb) warnings.push("Você não marcou nenhum carboidrato. Marque pelo menos um no Mercado.");
  if (!ids.some((id) => FOODS[id].cat === "veg")) warnings.push("Sem vegetais marcados: inclua legumes ou salada para fibras e saciedade.");
  return { empty: false, meals: out, totals, warnings, plan };
}

/* ---- nome do prato e modo de preparo de cada refeição ---- */
export function dishName(meal) {
  const n = (id) => FOODS[id].n.split(" (")[0].split(" ou ")[0].replace(/ (cozid[oa]s?|grelhad[oa]s?)$/, "").toLowerCase();
  const by = (cat) => meal.items.filter(([id]) => FOODS[id].cat === cat && !FOODS[id].fixed).map(([id]) => n(id));
  const fixed = meal.items.filter(([id]) => FOODS[id].fixed);
  const prot = by("prot"), carb = by("carb"), veg = fixed.filter(([id]) => FOODS[id].cat === "veg").map(([id]) => n(id)).slice(0, 2);
  const leg = fixed.filter(([id]) => id === "feijao" || id === "lentilha").map(([id]) => n(id));
  const fr = meal.items.filter(([id]) => FOODS[id].cat === "fruta").map(([id]) => n(id));
  const gd = meal.items.filter(([id]) => FOODS[id].cat === "gord" && !FOODS[id].fixed).map(([id]) => n(id));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (meal.key === "almoco" || meal.key === "jantar") { const parts = [...prot, ...carb, ...leg, ...veg]; return "Prato: " + (parts.length ? parts.join(" + ") : "livre"); }
  const parts = [...prot, ...carb, ...gd, ...fr]; return cap(parts.join(" + ") || "Livre");
}
export function plateTip(meal) {
  if (meal.key === "almoco" || meal.key === "jantar") return "Monte o prato: metade com salada e legumes, um quarto com a proteína e um quarto com o carboidrato. Sirva o feijão ao lado.";
  if (meal.key === "pre") return "Coma de 1h30 a 2h antes do treino. Carboidrato dá energia; evite muita gordura e fibra para não pesar.";
  if (meal.key === "ceia") return "Leve e com proteína lenta (iogurte, cottage): ajuda a recuperação durante o sono.";
  if (meal.key === "lanche") return "Lanche simples e proteico para segurar a fome até o almoço.";
  return "Comece o dia com proteína para segurar a fome até o almoço.";
}

/* ---- compras: quantidades para 7 dias (crus quando aplicável) ---- */
export function weekShopping(pantry, goal, fromDate, mealsN = 5) {
  const acc = {};
  for (let i = 0; i < 7; i++) { const d = new Date(fromDate + "T12:00:00"); d.setDate(d.getDate() + i); const iso = d.toISOString().slice(0, 10); generateMenu(pantry, goal, seedFor(iso), mealsN).meals.forEach((m) => m.items.forEach(([id, q]) => { acc[id] = (acc[id] || 0) + q; })); }
  const out = {};
  Object.entries(acc).forEach(([id, q]) => {
    const f = FOODS[id]; if (!f || f.u === "livre") return;
    let txt, num = q;
    if (per100(f)) { const raw = f.yield ? q / f.yield : q; num = raw; const kg = raw >= 1000 ? `${(raw / 1000).toFixed(2).replace(".", ",")} kg` : `${Math.round(raw / 10) * 10} g`; txt = `${kg}${f.yield ? " (cru)" : ""}`; if (f.u === "ml") txt = raw >= 1000 ? `${(raw / 1000).toFixed(1).replace(".", ",")} L` : `${Math.round(raw)} ml`; }
    else if (f.u === "col") txt = `${q} colheres de sopa`;
    else txt = id === "ovo" ? `${q} ovos (${Math.ceil(q / 12)} ${Math.ceil(q / 12) === 1 ? "dúzia" : "dúzias"})` : `${q} ${f.unitName ? f.unitName[1] : "unidades"}`;
    out[id] = { id, n: f.n, sec: f.sec, q, num, txt };
  });
  return out;
}

/* ---- pratos (receitas) ---- */
const R = (id, name, meals, time, ing, steps, tip) => ({ id, name, meals, time, ing, steps, tip });
export const RECIPES = [
  R("panqueca", "Panqueca de banana e aveia", ["cafe", "pre"], 10, [["banana", 1], ["ovo", 2], ["aveia", 40]], ["Amasse a banana com o garfo e misture os ovos e a aveia.", "Aqueça a frigideira antiaderente em fogo médio, sem óleo.", "Despeje a massa e doure 2 min de cada lado.", "Sirva com canela e, se quiser, iogurte por cima."], "Bata tudo no liquidificador para uma massa lisa."),
  R("tapioca_ovo", "Tapioca com ovo e cottage", ["cafe", "pre"], 8, [["tapioca", 40], ["ovo", 2], ["cottage", 60]], ["Hidrate a goma com uma pitada de sal e passe pela peneira.", "Espalhe na frigideira quente, sem óleo, até soltar; vire.", "Recheie com ovo mexido e cottage e dobre."], "A goma seca vira cerca de 3 vezes o volume ao hidratar."),
  R("ovos_pao", "Ovos mexidos com pão integral", ["cafe"], 7, [["ovo", 3], ["clara", 2], ["pao", 2]], ["Bata os ovos e as claras com sal e pimenta.", "Mexa na antiaderente em fogo baixo até ficar cremoso.", "Sirva sobre as fatias de pão tostadas."], "Tirar do fogo antes de secar deixa mais macio."),
  R("iogurte_bowl", "Bowl de iogurte com aveia e fruta", ["cafe", "ceia", "lanche"], 3, [["iogurte", 200], ["aveia", 30], ["banana", 1]], ["Coloque o iogurte na tigela e polvilhe a aveia.", "Corte a fruta por cima.", "Deixe descansar 5 min para a aveia amaciar."], "Troque a banana por morango ou mamão."),
  R("vitamina", "Vitamina proteica", ["pre", "lanche", "cafe"], 3, [["whey", 1], ["banana", 1], ["aveia", 30]], ["Bata o whey, a banana e a aveia com 250 ml de água gelada ou leite desnatado.", "Adicione gelo se preferir mais grosso."], "Beba até 1h30 antes do treino."),
  R("mingau", "Mingau proteico de aveia", ["cafe", "pre"], 5, [["aveia", 50], ["whey", 1], ["banana", 1]], ["Cozinhe a aveia com 200 ml de água por 3 min, mexendo.", "Espere amornar 1 min e misture o whey para não empelotar.", "Finalize com a banana e canela."], "Com leite desnatado fica mais cremoso."),
  R("cuscuz_ovo", "Cuscuz com ovo", ["cafe"], 12, [["cuscuz", 150], ["ovo", 2], ["cottage", 40]], ["Hidrate e cozinhe o cuscuz no vapor por 10 a 12 min.", "Faça os ovos mexidos ou pochê.", "Monte o prato e finalize com cottage."], "Prepare o cuscuz na véspera e aqueça no micro-ondas."),
  R("sanduba_frango", "Sanduíche de frango desfiado", ["pre", "lanche"], 5, [["frango", 100], ["pao", 2]], ["Desfie o frango grelhado e tempere com limão e ervas.", "Recheie as fatias tostadas.", "Acrescente folhas e tomate."], "Use frango de marmita, já pronto."),
  R("prato_feito", "Prato feito fitness", ["almoco", "jantar"], 5, [["frango", 150], ["arroz", 200], ["feijao", 100], ["salada", 1], ["azeite", 1]], ["Use o arroz e o feijão da marmita.", "Grelhe o frango (ou aqueça o que preparou).", "Monte: salada, frango, arroz e feijão ao lado, azeite na salada."], "É a base da dieta: monte o prato na mesma ordem toda vez."),
  R("bife_batata", "Bife com batata-doce e legumes", ["almoco", "jantar"], 20, [["patinho", 150], ["batata_doce", 200], ["legumes", 150]], ["Cozinhe ou asse a batata-doce.", "Tempere o bife e grelhe 3 a 4 min de cada lado.", "Cozinhe os legumes no vapor e monte o prato."], "Asse várias batatas de uma vez para a semana."),
  R("carne_moida", "Carne moída com legumes e arroz", ["almoco", "jantar"], 20, [["moida", 150], ["arroz", 150], ["legumes", 150]], ["Refogue alho e cebola, junte a carne e mexa até dourar.", "Adicione os legumes picados e um pouco de água; tampe por 8 min.", "Sirva com o arroz."], "Faça em dobro: rende marmita e congela bem."),
  R("peixe_forno", "Peixe assado com batata e brócolis", ["almoco", "jantar"], 25, [["tilapia", 180], ["batata", 200], ["brocolis", 120]], ["Forre a assadeira e disponha as batatas em rodelas; asse 15 min a 200 °C.", "Junte o peixe temperado com limão e o brócolis; asse mais 15 min.", "Finalize com azeite e salsinha."], "Papel-alumínio por cima deixa o peixe mais suculento."),
  R("escondidinho", "Escondidinho de batata-doce com frango", ["almoco", "jantar"], 30, [["frango", 150], ["batata_doce", 250]], ["Cozinhe e amasse a batata-doce com sal (purê).", "Refogue o frango desfiado com alho, cebola e tomate.", "Monte em camadas no refratário e leve ao forno 10 min."], "Ótimo para congelar em porções individuais."),
  R("macarrao_atum", "Macarrão com atum e legumes", ["almoco", "jantar"], 15, [["macarrao", 150], ["atum", 120], ["legumes", 150], ["azeite", 1]], ["Cozinhe o macarrão al dente.", "Refogue o legume picado com alho, junte o atum e o macarrão.", "Finalize com azeite, limão e salsinha."], "Molho de tomate natural dá cremosidade sem gordura."),
  R("omelete_forno", "Omelete de forno com legumes", ["almoco", "jantar", "cafe"], 25, [["ovo", 3], ["clara", 3], ["legumes", 150]], ["Bata os ovos e as claras com sal e ervas.", "Misture os legumes picados e despeje em forma pequena untada.", "Asse a 200 °C por 20 min, até dourar."], "Corte em porções e leve na marmita."),
  R("salada_atum", "Salada completa de atum", ["almoco", "jantar"], 8, [["atum", 120], ["salada", 1], ["tomate", 100], ["azeite", 1]], ["Lave e monte as folhas com o tomate.", "Escorra e adicione o atum.", "Tempere com limão, azeite e uma pitada de sal."], "Some 100 g de arroz ou batata para ficar prato completo."),
  R("iogurte_pasta", "Iogurte com pasta de amendoim", ["ceia"], 2, [["iogurte", 200], ["pasta", 1]], ["Coloque o iogurte na tigela.", "Junte a pasta de amendoim e misture levemente.", "Finalize com canela."], "Gordura boa e proteína de digestão lenta antes de dormir."),
  R("frango_desfiado", "Frango desfiado para a semana", ["almoco", "jantar", "pre"], 30, [["frango", 900]], ["Cozinhe 1,2 kg de peito cru na panela de pressão com alho, cebola, sal e água até cobrir: 15 min após pegar pressão.", "Deixe esfriar no caldo e desfie com o garfo (ou na batedeira, em 30 s).", "Divida em potes de 150 g e guarde: 4 dias na geladeira, 3 meses no freezer."], "Rende cerca de 900 g de frango pronto."),
];
export function recipeMacros(r) { const m = sumMacros(r.ing); return { ...m, kcal: kcalOf(m) }; }
export const MEAL_PREP = [
  "Cozinhe o arroz (3 a 4 dias) e o feijão na panela de pressão; guarde em potes de porção.",
  "Grelhe ou asse o frango e a carne da semana; separe em porções de 150 g.",
  "Asse a batata-doce inteira e cozinhe os ovos (5 dias na geladeira).",
  "Lave e corte os legumes; deixe as folhas secas em pote com papel toalha.",
  "Monte as marmitas de segunda a quinta; congele as de sexta a domingo.",
  "Rotule com a data. Descongele na geladeira de um dia para o outro e aqueça bem.",
];
