import React from "react";

/* ===== paleta das ilustrações (independe do tema) ===== */
const STEEL = "#8391A1", PAD = "#3E4A59", SLAB = "#B7C1CC", CABLE = "#9AA6B3", MOVE = "#FF6B2C";
const SKIN = "#EBBB93", SHIRT = "#4F7DF3", SHORTS = "#2E3845", GROUND = "#C4CCD5";

const Ln = (x1, y1, x2, y2, c = STEEL, w = 6, extra = {}) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" {...extra} />;
const Rc = (x, y, w, h, c = PAD, r = 4, extra = {}) => <rect x={x} y={y} width={w} height={h} rx={r} fill={c} {...extra} />;
const Ci = (x, y, r, c = STEEL) => <circle cx={x} cy={y} r={r} fill={c} />;
const Stack = ({ x, y, w = 28, h = 100, n = 7, pin = 2 }) => {
  const gap = 2, sh = (h - gap * (n - 1)) / n;
  return <g>{Array.from({ length: n }, (_, i) => <rect key={i} x={x} y={y + i * (sh + gap)} width={w} height={sh} rx="2.5" fill={SLAB} />)}<rect x={x - 2} y={y + pin * (sh + gap) + sh / 2 - 2} width={w + 4} height="4" rx="2" fill={MOVE} /></g>;
};
const Arrow = ({ x1, y1, x2, y2 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), s = 7;
  const p = (t) => `${x2 - s * Math.cos(a + t)},${y2 - s * Math.sin(a + t)}`;
  return <g><Ln x1={x1} y1={y1} x2={x2} y2={y2} /><polygon points={`${x2},${y2} ${p(0.5)} ${p(-0.5)}`} fill={MOVE} /></g>;
};
const A = (x1, y1, x2, y2) => <g stroke={MOVE} strokeWidth="3" strokeLinecap="round"><line x1={x1} y1={y1} x2={x2} y2={y2} /><polygon points={arrowHead(x1, y1, x2, y2)} fill={MOVE} stroke="none" /></g>;
function arrowHead(x1, y1, x2, y2) { const a = Math.atan2(y2 - y1, x2 - x1), s = 8; const q = (t) => `${(x2 - s * Math.cos(a + t)).toFixed(1)},${(y2 - s * Math.sin(a + t)).toFixed(1)}`; return `${x2},${y2} ${q(0.55)} ${q(-0.55)}`; }
const Arc = (d, hx, hy, ang) => <g><path d={d} fill="none" stroke={MOVE} strokeWidth="3" strokeLinecap="round" /><polygon points={arrowHead(hx - Math.cos(ang) * 4, hy - Math.sin(ang) * 4, hx, hy)} fill={MOVE} /></g>;
const limb = (pts, c, w) => <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
const Head = (x, y) => <circle cx={x} cy={y} r="9.5" fill={SKIN} />;
const Torso = (a, b) => limb([a, b], SHIRT, 17);
const Arm = (...p) => limb(p, SKIN, 6.5);
const Thigh = (...p) => limb(p, SHORTS, 12);
const Shin = (...p) => limb(p, SKIN, 8);
const Ground = () => <line x1="8" y1="152" x2="232" y2="152" stroke={GROUND} strokeWidth="3" strokeLinecap="round" />;

const SCENES = {
  pulldown: () => (<g>
    <Ground />{Ln(176, 150, 176, 20)}{Ln(176, 20, 98, 20)}{Ci(98, 22, 6)}
    <Stack x={186} y={44} h={106} pin={3} />
    {Ln(98, 26, 98, 60, CABLE, 2.5)}{Rc(78, 58, 40, 7, MOVE, 3.5)}
    {Rc(104, 118, 46, 9)}{Ln(126, 127, 126, 150)}{Rc(98, 100, 36, 7)}{Ln(134, 103, 150, 103, STEEL, 5)}{Ln(150, 103, 150, 118, STEEL, 5)}
    {Thigh([126, 114], [96, 110])}{Shin([96, 110], [94, 148])}
    {Torso([128, 112], [131, 76])}{Head(133, 58)}
    {Arm([130, 78], [116, 92], [100, 64])}
    {A(64, 56, 64, 92)}
  </g>),
  cable_row: () => (<g>
    <Ground />
    <Stack x={12} y={56} h={94} pin={4} />{Ci(56, 130, 6)}
    {Ln(56, 130, 120, 102, CABLE, 2.5)}{Ln(114, 98, 124, 106, MOVE, 5)}
    {Ln(78, 150, 96, 128, STEEL, 6)}{Rc(150, 122, 50, 9)}{Ln(176, 131, 176, 150)}
    {Thigh([166, 120], [130, 112])}{Shin([130, 112], [92, 132])}
    {Torso([166, 118], [158, 76])}{Head(156, 58)}
    {Arm([158, 80], [146, 94], [124, 102])}
    {A(96, 90, 132, 90)}
  </g>),
  chest_press: () => (<g>
    <Ground />{Ln(198, 150, 198, 44)}<Stack x={204} y={46} w={26} h={104} pin={3} />
    {Rc(150, 62, 12, 58)}{Rc(112, 120, 52, 9)}{Ln(140, 129, 140, 150)}
    {Ln(176, 84, 108, 80, STEEL, 6)}{Ci(178, 84, 6)}{Rc(103, 70, 6, 20, MOVE, 3)}
    {Thigh([142, 118], [112, 114])}{Shin([112, 114], [110, 148])}
    {Torso([146, 114], [148, 74])}{Head(148, 56)}
    {Arm([148, 78], [128, 88], [108, 80])}
    {A(96, 62, 68, 62)}
  </g>),
  incline_press: () => (<g>
    <Ground />{Ln(198, 150, 198, 44)}<Stack x={204} y={46} w={26} h={104} pin={3} />
    {Rc(146, 62, 12, 60, PAD, 5, { transform: "rotate(22 152 122)" })}{Rc(112, 122, 50, 9)}{Ln(140, 131, 140, 150)}
    {Ln(180, 92, 112, 64, STEEL, 6)}{Ci(182, 92, 6)}{Rc(104, 54, 7, 22, MOVE, 3, { transform: "rotate(-20 108 65)" })}
    {Thigh([142, 120], [112, 116])}{Shin([112, 116], [110, 148])}
    {Torso([144, 116], [156, 76])}{Head(160, 60)}
    {Arm([156, 80], [136, 84], [112, 66])}
    {A(92, 52, 68, 36)}
  </g>),
  pec_deck: () => (<g>
    <Ground />{Ln(172, 150, 172, 34)}<Stack x={190} y={44} w={26} h={106} pin={2} />{Rc(112, 60, 11, 40, PAD, 5)}{Ln(117, 100, 117, 122, STEEL, 5)}{Ln(117, 122, 150, 122, STEEL, 5)}
    {Rc(152, 62, 11, 56)}{Rc(118, 120, 50, 9)}{Ln(142, 129, 142, 150)}
    {Thigh([146, 118], [118, 114])}{Shin([118, 114], [116, 148])}
    {Torso([150, 114], [152, 74])}{Head(152, 56)}
    {Arm([152, 78], [132, 90], [130, 68])}
    {Arc("M96 96 Q84 82 96 66", 96, 66, -1.0)}
  </g>),
  leg_press: () => (<g>
    <Ground />{Ln(64, 150, 202, 44, STEEL, 8)}{Ln(150, 150, 150, 96, STEEL, 5)}
    <g transform="rotate(-38 152 88)">{Rc(150, 66, 9, 44, MOVE, 3)}{Rc(159, 68, 34, 8, SLAB, 3)}{Rc(159, 80, 34, 8, SLAB, 3)}{Rc(159, 92, 34, 8, SLAB, 3)}</g>
    {Rc(30, 96, 12, 44, PAD, 5, { transform: "rotate(-32 36 118)" })}{Rc(46, 128, 40, 9)}{Ln(66, 137, 66, 150)}
    {Thigh([70, 124], [108, 86])}{Shin([108, 86], [140, 104])}
    {Torso([66, 122], [44, 96])}{Head(34, 84)}
    {Arm([48, 100], [58, 120])}
    {A(176, 56, 200, 34)}
  </g>),
  leg_ext: () => (<g>
    <Ground />{Ln(88, 150, 88, 60)}<Stack x={16} y={54} h={96} pin={3} />
    {Rc(96, 58, 11, 56)}{Rc(96, 114, 52, 9)}{Ln(122, 123, 122, 150)}
    {Ln(142, 126, 170, 96, MOVE, 5)}{Ci(140, 126, 5)}{Rc(163, 84, 11, 24, PAD, 5, { transform: "rotate(-30 168 96)" })}
    {Thigh([104, 112], [142, 114])}{Shin([142, 114], [170, 92])}
    {Torso([102, 112], [102, 74])}{Head(104, 56)}
    {Arm([103, 78], [112, 96], [126, 104])}
    {Arc("M190 118 Q204 100 194 80", 194, 80, -1.2)}
  </g>),
  leg_curl: () => (<g>
    <Ground />{Ln(172, 150, 172, 110)}<Stack x={192} y={56} w={26} h={94} pin={3} />
    {Rc(44, 110, 112, 10)}{Ln(70, 120, 70, 150)}{Ln(136, 120, 136, 150)}
    {Ln(156, 78, 172, 112, MOVE, 5)}{Ci(172, 112, 5)}{Rc(148, 66, 12, 24, PAD, 5, { transform: "rotate(-15 154 78)" })}
    {Torso([56, 100], [96, 102])}{Head(42, 98)}
    {Thigh([96, 102], [138, 102])}{Shin([138, 102], [154, 76])}
    {Arm([58, 104], [50, 116])}
    {Arc("M176 58 Q192 76 178 96", 178, 96, 1.6)}
  </g>),
  cable_cross: () => (<g>
    <Ground />{Ln(34, 150, 34, 22)}{Ln(206, 150, 206, 22)}{Ln(34, 22, 206, 22, STEEL, 4)}
    <Stack x={40} y={62} w={9} h={88} n={6} pin={2} /><Stack x={191} y={62} w={9} h={88} n={6} pin={2} />
    {Ci(34, 30, 5)}{Ci(206, 30, 5)}
    {Ln(34, 32, 82, 88, CABLE, 2.5)}{Ln(206, 32, 158, 88, CABLE, 2.5)}{Ci(82, 88, 5, MOVE)}{Ci(158, 88, 5, MOVE)}
    {limb([[112, 148], [116, 112]], SKIN, 8)}{limb([[128, 148], [124, 112]], SKIN, 8)}{limb([[120, 108], [120, 66]], SHIRT, 22)}{Thigh([114, 112], [126, 112])}
    {Head(120, 48)}
    {limb([[108, 68], [92, 82], [82, 88]], SKIN, 6.5)}{limb([[132, 68], [148, 82], [158, 88]], SKIN, 6.5)}
    {A(72, 108, 100, 108)}{A(168, 108, 140, 108)}
  </g>),
  cable_tower: () => (<g>
    <Ground />{Ln(176, 150, 176, 16)}<Stack x={184} y={40} w={28} h={110} pin={3} />{Ci(146, 24, 6)}{Ln(146, 24, 176, 24, STEEL, 5)}
    {Ln(146, 30, 124, 86, CABLE, 2.5)}{Ln(118, 84, 130, 90, MOVE, 5)}
    {limb([[90, 148], [98, 108]], SKIN, 8)}{limb([[108, 148], [104, 108]], SKIN, 8)}{limb([[100, 108], [102, 66]], SHIRT, 20)}{Thigh([96, 110], [106, 110])}
    {Head(104, 48)}
    {Arm([104, 70], [102, 90], [122, 88])}
    {A(150, 66, 150, 100)}
  </g>),
  smith: () => (<g>
    <Ground />{Ln(50, 150, 50, 18, STEEL, 5)}{Ln(190, 150, 190, 18, STEEL, 5)}
    {Ln(50, 76, 190, 76, MOVE, 5)}{Rc(36, 58, 9, 36, SLAB, 3)}{Rc(195, 58, 9, 36, SLAB, 3)}{Rc(26, 62, 8, 28, SLAB, 3)}{Rc(206, 62, 8, 28, SLAB, 3)}
    {Ln(44, 128, 56, 128, MOVE, 3)}{Ln(184, 128, 196, 128, MOVE, 3)}
    {limb([[100, 148], [98, 126], [112, 114]], SKIN, 8)}{limb([[140, 148], [142, 126], [128, 114]], SKIN, 8)}{Thigh([112, 114], [98, 124])}{Thigh([128, 114], [142, 124])}
    {limb([[120, 112], [120, 82]], SHIRT, 24)}{Head(120, 62)}
    {limb([[108, 82], [90, 76]], SKIN, 6.5)}{limb([[132, 82], [150, 76]], SKIN, 6.5)}
    {A(120, 30, 120, 52)}
  </g>),
  shoulder_press: () => (<g>
    <Ground />{Ln(192, 150, 192, 34)}<Stack x={200} y={46} w={28} h={104} pin={3} />
    {Ln(182, 40, 118, 40, STEEL, 6)}{Ci(184, 40, 6)}{Rc(112, 34, 8, 16, MOVE, 3)}
    {Rc(152, 68, 12, 54)}{Rc(116, 122, 52, 9)}{Ln(142, 131, 142, 150)}
    {Thigh([146, 120], [114, 116])}{Shin([114, 116], [112, 148])}
    {Torso([150, 116], [152, 80])}{Head(152, 62)}
    {Arm([152, 82], [134, 74], [120, 44])}
    {A(90, 76, 90, 46)}
  </g>),
  abductor: () => (<g>
    <Ground /><Stack x={200} y={52} w={26} h={98} pin={3} />
    {Rc(94, 118, 52, 9)}{Ln(120, 127, 120, 150)}{Rc(112, 60, 16, 60)}
    {limb([[112, 118], [86, 112], [84, 148]], SKIN, 8)}{limb([[128, 118], [154, 112], [156, 148]], SKIN, 8)}
    {Thigh([112, 118], [88, 112])}{Thigh([128, 118], [152, 112])}
    {Torso([120, 116], [120, 72])}{Head(120, 54)}
    {Rc(66, 92, 11, 38, PAD, 5)}{Rc(163, 92, 11, 38, PAD, 5)}{Ln(70, 130, 70, 144, STEEL, 5)}{Ln(168, 130, 168, 144, STEEL, 5)}
    {A(58, 108, 40, 108)}{A(182, 108, 200, 108)}
  </g>),
  calf: () => (<g>
    <Ground />{Ln(146, 150, 146, 34)}<Stack x={184} y={54} w={28} h={96} pin={3} />
    {Rc(60, 138, 60, 12, STEEL, 3)}{Ln(146, 40, 96, 46, STEEL, 6)}{Rc(84, 42, 26, 10, PAD, 4)}
    {limb([[100, 136], [100, 108], [98, 84]], SKIN, 9)}{Thigh([98, 84], [98, 60])}
    {Torso([98, 60], [98, 48])}{Head(98, 30)}
    {limb([[96, 138], [86, 138]], SKIN, 7)}
    {A(70, 128, 70, 100)}
  </g>),
  row_machine: () => (<g>
    <Ground /><Stack x={12} y={54} h={96} pin={3} />{Ln(56, 82, 96, 82, STEEL, 6)}{Ci(56, 82, 6)}{Rc(94, 72, 6, 22, MOVE, 3)}
    {Rc(112, 60, 12, 46)}{Ln(118, 106, 118, 150)}{Rc(130, 120, 52, 9)}{Ln(160, 129, 160, 150)}
    {Thigh([158, 118], [124, 122])}{Shin([124, 122], [122, 148])}
    {Torso([152, 116], [132, 76])}{Head(126, 60)}
    {Arm([134, 80], [120, 86], [98, 82])}
    {A(80, 62, 110, 62)}
  </g>),
  cable_crunch: () => (<g>
    <Ground />{Ln(176, 150, 176, 16)}<Stack x={184} y={40} w={28} h={110} pin={3} />{Ci(146, 24, 6)}{Ln(146, 24, 176, 24, STEEL, 5)}
    {Rc(84, 146, 60, 6, PAD, 3)}
    {Shin([146, 146], [110, 146])}{Thigh([110, 146], [110, 112])}
    {Torso([110, 112], [92, 84])}{Head(80, 92)}
    {Ln(146, 30, 92, 78, CABLE, 2.5)}{Ln(84, 76, 98, 84, MOVE, 5)}
    {Arm([96, 88], [92, 80])}
    {Arc("M70 64 Q62 84 76 104", 76, 104, 1.0)}
  </g>),
  captain: () => (<g>
    <Ground />{Ln(84, 150, 84, 24)}{Ln(150, 150, 150, 24)}{Ln(84, 24, 150, 24, STEEL, 5)}
    {Rc(100, 34, 14, 78)}{Rc(90, 56, 30, 8, PAD, 4)}
    {Torso([108, 60], [108, 108])}{Head(106, 42)}
    {Arm([106, 62], [116, 62], [122, 62])}
    {Thigh([108, 108], [140, 100])}{Shin([140, 100], [138, 132])}
    {A(160, 128, 160, 100)}
  </g>),
  pullup: () => (<g>
    <Ground />{Ln(46, 150, 46, 22, STEEL, 6)}{Ln(194, 150, 194, 22, STEEL, 6)}{Ln(46, 22, 194, 22, MOVE, 6)}
    {limb([[112, 70], [98, 44], [96, 24]], SKIN, 6.5)}{limb([[128, 70], [142, 44], [144, 24]], SKIN, 6.5)}
    {Head(120, 52)}{limb([[120, 70], [120, 104]], SHIRT, 24)}{Thigh([116, 104], [114, 128])}{Thigh([124, 104], [126, 128])}{Shin([114, 128], [116, 144])}{Shin([126, 128], [124, 144])}
    {A(210, 120, 210, 84)}
  </g>),
  ab_machine: () => (<g>
    <Ground />{Ln(196, 150, 196, 44)}<Stack x={204} y={48} w={26} h={102} pin={3} />
    {Rc(146, 66, 12, 52)}{Rc(118, 120, 50, 9)}{Ln(142, 129, 142, 150)}
    {Ln(190, 56, 112, 62, STEEL, 6)}{Ci(190, 56, 6)}{Rc(104, 62, 12, 34, MOVE, 5)}
    {Thigh([150, 116], [120, 118])}{Shin([120, 118], [118, 148])}
    {Torso([150, 112], [134, 76])}{Head(128, 62)}
    {Arm([136, 80], [120, 88], [112, 76])}
    {Arc("M82 64 Q70 84 84 104", 84, 104, 1.0)}
  </g>),
  floor: () => (<g>
    <Ground />{Rc(20, 138, 200, 10, PAD, 5)}
    {limb([[72, 112], [190, 132]], SHIRT, 18)}{Head(60, 108)}
    {limb([[76, 116], [72, 134]], SKIN, 7)}{limb([[186, 132], [200, 138]], SKIN, 8)}
    {Ln(76, 134, 84, 134, MOVE, 4)}
  </g>),
};

export const MACHINES = {
  pulldown: { name: "Puxador alto (pulley)", where: "Toda academia", common: true, setup: ["Ajuste o apoio das coxas para o joelho ficar preso, sem folga.", "Sente com o peito aberto e incline o tronco levemente para trás.", "Pegada um pouco mais larga que os ombros."], mistake: "Puxar a barra com as costas balançando. Use menos carga e desça os cotovelos." },
  cable_row: { name: "Remada baixa na polia", where: "Toda academia", common: true, setup: ["Apoie os pés na plataforma com os joelhos levemente flexionados.", "Coluna reta e peito aberto antes de começar.", "Escolha o triângulo ou a barra reta."], mistake: "Jogar o tronco para trás a cada repetição. Só os cotovelos se movem." },
  chest_press: { name: "Supino na máquina (chest press)", where: "Toda academia", common: true, setup: ["Ajuste o banco para as pegadas ficarem na altura do meio do peito.", "Costas coladas no encosto e escápulas para trás.", "Pés firmes no chão."], mistake: "Tirar as costas do encosto para empurrar. Reduza a carga." },
  incline_press: { name: "Supino inclinado na máquina", where: "Toda academia", common: true, setup: ["Ajuste o banco para as pegadas ficarem na altura do peito alto (encosto a cerca de 30°).", "Costas coladas no encosto e escápulas para trás.", "Empurre para cima e à frente, sem esticar totalmente os cotovelos."], mistake: "Erguer o quadril do banco para empurrar. Reduza a carga e mantenha os pés firmes." },
  pec_deck: { name: "Voador (peck deck)", where: "Toda academia", common: true, setup: ["Ajuste o banco: cotovelos na altura do peito.", "Antebraços apoiados nas almofadas.", "Costas coladas no encosto."], mistake: "Fechar com os ombros para frente. Mantenha o peito aberto." },
  leg_press: { name: "Leg press 45°", where: "Toda academia", common: true, setup: ["Encosto que deixe o joelho a 90° na descida.", "Pés na largura dos ombros, no meio da plataforma.", "Lombar sempre apoiada no encosto."], mistake: "Descer tanto que a lombar sai do banco. Pare antes disso." },
  leg_ext: { name: "Cadeira extensora", where: "Toda academia", common: true, setup: ["Encosto: joelho alinhado ao eixo da máquina.", "Rolete apoiado sobre o peito do pé.", "Segure nas alças para não sair do banco."], mistake: "Usar embalo. Suba forte e desça em 2 a 3 segundos." },
  leg_curl: { name: "Mesa flexora", where: "Toda academia", common: true, setup: ["Joelho alinhado ao eixo, rolete logo acima do calcanhar.", "Quadril colado no banco.", "Segure nas alças."], mistake: "Levantar o quadril para ganhar impulso." },
  cable_cross: { name: "Crossover (polia dupla)", where: "Toda academia", common: true, setup: ["Ajuste a altura das polias conforme o exercício.", "Um pé à frente para se equilibrar.", "Tronco levemente inclinado à frente."], mistake: "Dobrar demais os cotovelos e virar um supino. Mantenha os braços quase esticados." },
  cable_tower: { name: "Polia (torre de cabo)", where: "Toda academia", common: true, setup: ["Ajuste a altura da polia e escolha o acessório (corda, barra reta ou V).", "Fique perto da torre, com o cabo livre.", "Cotovelos parados junto ao corpo nos exercícios de braço."], mistake: "Balançar o corpo para mover o cabo." },
  smith: { name: "Smith (barra guiada)", where: "Toda academia", common: true, setup: ["Ajuste a altura da barra e as travas de segurança.", "Pés um pouco à frente da barra, por causa do trilho fixo.", "Gire o punho para destravar e travar a barra."], mistake: "Esquecer de armar as travas de segurança." },
  shoulder_press: { name: "Desenvolvimento na máquina", where: "Quase toda academia", common: true, setup: ["Ajuste o banco para as pegadas ficarem na altura do queixo.", "Costas coladas no encosto.", "Empurre para cima sem travar os cotovelos."], mistake: "Arquear a lombar. Contraia o abdômen." },
  abductor: { name: "Cadeira abdutora", where: "Toda academia", common: true, setup: ["Almofadas na parte externa dos joelhos.", "Costas coladas no encosto.", "Abra com controle e volte devagar."], mistake: "Bater as placas na volta. Controle o retorno." },
  calf: { name: "Panturrilha (máquina ou leg press)", where: "Toda academia", common: true, setup: ["Apoie só a ponta do pé na plataforma.", "Joelhos quase estendidos.", "Amplitude completa: alongue embaixo e suba na ponta."], mistake: "Fazer repetições curtas e rápidas. Pause 1 segundo no topo." },
  row_machine: { name: "Remada sentada na máquina", where: "Quase toda academia", common: true, setup: ["Ajuste o banco para o peito ficar apoiado na almofada.", "Braços esticados no início, sem tirar os ombros do lugar.", "Puxe os cotovelos para trás."], mistake: "Encolher os ombros ao puxar." },
  cable_crunch: { name: "Abdominal na polia", where: "Toda academia", common: true, setup: ["Ajoelhe de frente para a polia alta com a corda atrás da cabeça.", "Quadril fixo.", "Arredonde a coluna aproximando costelas do quadril."], mistake: "Puxar com os braços. O movimento é do abdômen." },
  captain: { name: "Estação de elevação de pernas", where: "Quase toda academia", common: true, setup: ["Antebraços nas almofadas e costas coladas no encosto.", "Suba os joelhos até o quadril passar dos 90°.", "Desça sem balançar."], mistake: "Balançar as pernas. Pare no fundo e recomece." },
  pullup: { name: "Barra fixa", where: "Toda academia", common: true, setup: ["Pegada um pouco mais larga que os ombros.", "Comece de braços esticados.", "Puxe o peito em direção à barra."], mistake: "Meia repetição. Use a máquina assistida se precisar." },
  ab_machine: { name: "Abdominal na máquina", where: "Quase toda academia", common: true, setup: ["Ajuste o banco para o eixo ficar na altura do umbigo.", "Peito apoiado na almofada e pés firmes.", "Flexione o tronco aproximando costelas e quadril."], mistake: "Puxar com os braços ou as pernas. O abdômen faz o movimento." },
  floor: { name: "Colchonete (solo)", where: "Toda academia", common: true, setup: ["Use o colchonete para proteger a coluna e os cotovelos.", "Mantenha o abdômen contraído.", "Respire sem prender o ar."], mistake: "Deixar o quadril cair na prancha." },
};
export const MACHINE_IDS = Object.keys(MACHINES);

export function MachineArt({ id, className = "" }) {
  const S = SCENES[id]; if (!S) return null;
  return (
    <svg viewBox="0 0 240 160" className={"mart " + className} role="img" aria-label={MACHINES[id].name}>
      <rect width="240" height="160" rx="18" fill="var(--art-bg, #E6EAEF)" />
      <S />
    </svg>
  );
}
