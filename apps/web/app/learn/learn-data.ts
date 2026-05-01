import { type Color, type Square } from "@chess-platform/chess-engine";

export type TrainingMove = {
  from: Square;
  notation: string;
  promotion?: "queen" | "rook" | "bishop" | "knight";
  to: Square;
};

export type TrainingTemplate = {
  difficulty: "Легко" | "Средне" | "Сложно";
  explanation: string;
  fen: string;
  goal: string;
  hints: string[];
  id: string;
  kind: "exact" | "style";
  orientation: Color;
  sourceLabel?: string;
  solutionMoves: TrainingMove[];
  title: string;
};

export type GreatPlayerTemplateSet = {
  accent: string;
  id: string;
  player: string;
  styleSummary: string;
  templates: TrainingTemplate[];
};

export const greatPlayerTemplates: GreatPlayerTemplateSet[] = [
  {
    accent: "Техника",
    id: "carlsen",
    player: "Magnus Carlsen",
    styleSummary:
      "Давит без спешки: активный король, полезные размены и маленькие слабости, которые становятся решающими.",
    templates: [
      {
        difficulty: "Средне",
        explanation:
          "Король уходит на b2, белые сохраняют защиту пешки a3 и получают время для размена слона. Это типичная техника Карлсена: не форсировать мат, а оставить сопернику эндшпиль без контригры.",
        fen: "8/7B/8/2pkP2R/p6p/PbK5/6PP/2r5 w - - 3 46",
        goal: "Найдите точный ответ на шах и удержите эндшпильное давление.",
        hints: [
          "Белому королю нужно уйти так, чтобы ладья черных не выиграла пешку a3 с темпом.",
          "После ухода короля слон с h7 готов включиться через g8.",
          "Главная идея не в атаке, а в сохранении связки слабостей на ферзевом фланге."
        ],
        id: "carlsen-anand-2013",
        kind: "exact",
        orientation: "white",
        sourceLabel: "Carlsen-Anand, Chennai 2013, game 5, after 45...Rc1+",
        solutionMoves: [
          { from: "c3", notation: "46.Kb2", to: "b2" },
          { from: "c1", notation: "46...Rg1", to: "g1" },
          { from: "h7", notation: "47.Bg8+", to: "g8" }
        ],
        title: "Эндшпильное давление"
      },
      {
        difficulty: "Легко",
        explanation:
          "В простых окончаниях активность короля важнее раннего движения пешки. Kd3 улучшает фигуру, держит поле e4 и готовит спокойное продвижение.",
        fen: "8/8/8/2k5/8/2K1P3/8/8 w - - 0 1",
        goal: "Сначала улучшите короля, потом двигайте пешку.",
        hints: [
          "Не толкайте пешку сразу: король должен занять центральное поле.",
          "Ход должен приблизить короля к пешке и не подпустить черного короля."
        ],
        id: "carlsen-style-king",
        kind: "style",
        orientation: "white",
        solutionMoves: [{ from: "c3", notation: "Kd3", to: "d3" }],
        title: "Шаблон активного короля"
      }
    ]
  },
  {
    accent: "Инициатива",
    id: "kasparov",
    player: "Garry Kasparov",
    styleSummary:
      "Накапливает энергию фигур до момента, когда позиционный перевес превращается в конкретный тактический удар.",
    templates: [
      {
        difficulty: "Сложно",
        explanation:
          "Rxd4 открывает линии и втягивает черного короля в тактическую гонку. После вынужденного ...cxd4 ладья входит на e7, и инициатива становится важнее материала.",
        fen: "b2r3r/k4p1p/p2q1np1/NppP4/3p1Q2/P4PPB/1PP4P/1K1RR3 w - - 1 24",
        goal: "Начните знаменитую серию жертв против короля.",
        hints: [
          "Черный король на a7 выглядит далеко, но линии вокруг него можно открыть.",
          "Ищите ход ладьей, который добровольно отдает материал ради темпа.",
          "После взятия на d4 белая ладья должна ворваться на седьмую горизонталь."
        ],
        id: "kasparov-topalov-1999",
        kind: "exact",
        orientation: "white",
        sourceLabel: "Kasparov-Topalov, Wijk aan Zee 1999, before 24.Rxd4",
        solutionMoves: [
          { from: "d1", notation: "24.Rxd4!!", to: "d4" },
          { from: "c5", notation: "24...cxd4", to: "d4" },
          { from: "e1", notation: "25.Re7+", to: "e7" }
        ],
        title: "Жертва ради темпа"
      }
    ]
  },
  {
    accent: "Расчет",
    id: "fischer",
    player: "Bobby Fischer",
    styleSummary:
      "Превращает развитие и координацию в форсированную тактику, где материал временно перестает быть главным.",
    templates: [
      {
        difficulty: "Сложно",
        explanation:
          "Be6 не спасает ферзя, а приглашает белых его забрать. Фишер получает темпы, открытые линии и серию шахов, где активность фигур компенсирует ферзя.",
        fen: "r3r1k1/pp3pbp/1qp3p1/2B5/2BP2b1/Q1n2N2/P4PPP/3R1K1R b - - 3 17",
        goal: "Найдите ход, который позволяет пожертвовать ферзя за инициативу.",
        hints: [
          "Ферзь на b6 атакован, но уход ферзем снижает давление.",
          "Чернопольный слон может включиться с темпом и оставить белого короля без покоя.",
          "После принятия жертвы ищите шах слоном."
        ],
        id: "byrne-fischer-1956",
        kind: "exact",
        orientation: "black",
        sourceLabel: "Byrne-Fischer, New York 1956, before 17...Be6",
        solutionMoves: [
          { from: "g4", notation: "17...Be6!!", to: "e6" },
          { from: "c5", notation: "18.Bxb6", to: "b6" },
          { from: "e6", notation: "18...Bxc4+", to: "c4" }
        ],
        title: "Ферзь за инициативу"
      }
    ]
  },
  {
    accent: "Удушение",
    id: "karpov",
    player: "Anatoly Karpov",
    styleSummary:
      "Ограничивает фигуры соперника тихими ходами, забирая у позиции воздух до того, как начинается конкретная атака.",
    templates: [
      {
        difficulty: "Средне",
        explanation:
          "Ba7 выглядит странно, но именно этот ход выключает ладьи и коня черных из игры. Карпов не атакует сразу: он сначала делает позицию соперника неудобной.",
        fen: "r1rq1bk1/1n1b1p1p/3p1np1/1p1Pp3/1Pp1P3/2P1BNNP/R2Q1PP1/1B2R1K1 w - - 2 24",
        goal: "Найдите тихий ход, который сковывает фигуры черных.",
        hints: [
          "Не ищите немедленный удар по королю.",
          "Черные ладьи и конь b7 зависят от полей на линии a.",
          "Слон может занять поле, где он не берет материал, но забирает свободу."
        ],
        id: "karpov-unzicker-1974",
        kind: "exact",
        orientation: "white",
        sourceLabel: "Karpov-Unzicker, Nice Olympiad 1974, before 24.Ba7",
        solutionMoves: [{ from: "e3", notation: "24.Ba7!", to: "a7" }],
        title: "Тихий зажим"
      }
    ]
  },
  {
    accent: "Жертва",
    id: "tal",
    player: "Mikhail Tal",
    styleSummary:
      "Меняет характер позиции жертвой, заставляя соперника решать практические задачи вместо спокойной защиты.",
    templates: [
      {
        difficulty: "Сложно",
        explanation:
          "Rd4 преследует слона и сохраняет напряжение вокруг проходной пешки. Это не одноходовая комбинация, а талевский способ держать соперника в сети угроз.",
        fen: "2r3k1/pp4bp/3p2p1/3P1b2/2r5/1RN4P/P2BpPBK/2R5 b - - 0 26",
        goal: "Найдите активный ход ладьей, который запускает принудительную игру.",
        hints: [
          "Белый слон d2 перегружен защитой и не имеет хороших полей.",
          "Ладья должна атаковать с темпом, а не пассивно защищать пешку.",
          "После хода черных белые почти вынуждены отступить слоном на e1."
        ],
        id: "botvinnik-tal-1960",
        kind: "exact",
        orientation: "black",
        sourceLabel: "Botvinnik-Tal, Moscow 1960, game 6, tactical continuation",
        solutionMoves: [
          { from: "c4", notation: "26...Rd4!", to: "d4" },
          { from: "d2", notation: "27.Be1", to: "e1" }
        ],
        title: "Активность важнее материала"
      },
      {
        difficulty: "Легко",
        explanation:
          "Bxh7+ открывает классический атакующий шаблон: король вытягивается вперед, а белые получают темпы для ферзя и коня.",
        fen: "rnbq1rk1/ppp2ppp/3b1n2/3pN3/3P4/3B4/PPP2PPP/RNBQ1RK1 w - - 0 1",
        goal: "Найдите жертву, которая меняет спокойную позицию на атаку.",
        hints: [
          "Цель находится на h7.",
          "Ход должен быть шахом и вынудить короля принять решение."
        ],
        id: "tal-style-greek-gift",
        kind: "style",
        orientation: "white",
        solutionMoves: [{ from: "d3", notation: "Bxh7+", to: "h7" }],
        title: "Шаблон греческого дара"
      }
    ]
  },
  {
    accent: "Эндшпиль",
    id: "capablanca",
    player: "Jose Raul Capablanca",
    styleSummary:
      "Играет простыми ходами, но каждая фигура занимает максимум активности, особенно в ладейных и пешечных окончаниях.",
    templates: [
      {
        difficulty: "Средне",
        explanation:
          "Kg3 не защищает пешку напрямую, но активизирует короля. После ...Rxc3+ Kh4 белые готовы использовать проходную g-пешку и активную ладью.",
        fen: "5k2/p1p4R/1pr5/3p1pP1/P2P1P2/2P2K2/8/8 w - - 0 35",
        goal: "Найдите королевский ход, который делает окончание технически выигранным.",
        hints: [
          "Белые не обязаны сразу спасать пешку c3.",
          "Король должен идти к пешкам королевского фланга.",
          "После шаха ладьи белый король не прячется, а становится активнее."
        ],
        id: "capablanca-tartakower-1924",
        kind: "exact",
        orientation: "white",
        sourceLabel: "Capablanca-Tartakower, New York 1924, before 35.Kg3",
        solutionMoves: [
          { from: "f3", notation: "35.Kg3!", to: "g3" },
          { from: "c6", notation: "35...Rxc3+", to: "c3" },
          { from: "g3", notation: "36.Kh4", to: "h4" }
        ],
        title: "Активный король"
      }
    ]
  }
];
