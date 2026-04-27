export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type Square = `${File}${Rank}`;

export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
export type Color = "white" | "black";

export type Piece = {
  type: PieceType;
  color: Color;
};

export type BoardState = {
  squares: Record<Square, Piece | null>;
  turn: Color;
  castling: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassant: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
};

type CastlingKey = keyof BoardState["castling"];

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
const promotionTypes = new Set<PieceType>(["queen", "rook", "bishop", "knight"]);

const pieceByFen = {
  k: { type: "king", color: "black" },
  q: { type: "queen", color: "black" },
  r: { type: "rook", color: "black" },
  b: { type: "bishop", color: "black" },
  n: { type: "knight", color: "black" },
  p: { type: "pawn", color: "black" },
  K: { type: "king", color: "white" },
  Q: { type: "queen", color: "white" },
  R: { type: "rook", color: "white" },
  B: { type: "bishop", color: "white" },
  N: { type: "knight", color: "white" },
  P: { type: "pawn", color: "white" }
} as const satisfies Record<string, Piece>;

const fenByPiece: Record<Color, Record<PieceType, string>> = {
  white: {
    king: "K",
    queen: "Q",
    rook: "R",
    bishop: "B",
    knight: "N",
    pawn: "P"
  },
  black: {
    king: "k",
    queen: "q",
    rook: "r",
    bishop: "b",
    knight: "n",
    pawn: "p"
  }
};

export function parseFEN(fen: string): BoardState {
  const parts = fen.trim().split(/\s+/);

  if (parts.length !== 6) {
    throw new Error("Invalid FEN: expected six fields");
  }

  const [placement, activeColor, castlingField, enPassantField, halfmoveField, fullmoveField] = parts;
  const squares = createEmptySquares();
  const fenRanks = placement.split("/");

  if (fenRanks.length !== 8) {
    throw new Error("Invalid FEN: expected eight ranks");
  }

  fenRanks.forEach((rankPlacement, rankOffset) => {
    let fileIndex = 0;
    const rank = 7 - rankOffset;

    for (const char of rankPlacement) {
      if (/^[1-8]$/.test(char)) {
        fileIndex += Number(char);
        continue;
      }

      const piece = pieceByFen[char as keyof typeof pieceByFen];

      if (!piece || fileIndex > 7) {
        throw new Error("Invalid FEN: invalid piece placement");
      }

      squares[toSquare(fileIndex, rank)] = { ...piece };
      fileIndex += 1;
    }

    if (fileIndex !== 8) {
      throw new Error("Invalid FEN: rank does not contain eight files");
    }
  });

  if (activeColor !== "w" && activeColor !== "b") {
    throw new Error("Invalid FEN: invalid active color");
  }

  if (castlingField !== "-" && !/^[KQkq]+$/.test(castlingField)) {
    throw new Error("Invalid FEN: invalid castling rights");
  }

  const enPassant = enPassantField === "-" ? null : assertSquare(enPassantField);
  const halfmoveClock = Number(halfmoveField);
  const fullmoveNumber = Number(fullmoveField);

  if (!Number.isInteger(halfmoveClock) || halfmoveClock < 0) {
    throw new Error("Invalid FEN: invalid halfmove clock");
  }

  if (!Number.isInteger(fullmoveNumber) || fullmoveNumber < 1) {
    throw new Error("Invalid FEN: invalid fullmove number");
  }

  return {
    squares,
    turn: activeColor === "w" ? "white" : "black",
    castling: {
      whiteKingside: castlingField.includes("K"),
      whiteQueenside: castlingField.includes("Q"),
      blackKingside: castlingField.includes("k"),
      blackQueenside: castlingField.includes("q")
    },
    enPassant,
    halfmoveClock,
    fullmoveNumber
  };
}

export function toFEN(state: BoardState): string {
  const placement = [...ranks]
    .reverse()
    .map((rank) => {
      let empty = 0;
      let output = "";

      for (const file of files) {
        const piece = state.squares[`${file}${rank}`];

        if (!piece) {
          empty += 1;
          continue;
        }

        if (empty > 0) {
          output += String(empty);
          empty = 0;
        }

        output += fenByPiece[piece.color][piece.type];
      }

      return empty > 0 ? output + String(empty) : output;
    })
    .join("/");

  const castling =
    `${state.castling.whiteKingside ? "K" : ""}${state.castling.whiteQueenside ? "Q" : ""}` +
    `${state.castling.blackKingside ? "k" : ""}${state.castling.blackQueenside ? "q" : ""}`;

  return [
    placement,
    state.turn === "white" ? "w" : "b",
    castling || "-",
    state.enPassant ?? "-",
    state.halfmoveClock,
    state.fullmoveNumber
  ].join(" ");
}

export function getLegalMoves(state: BoardState, from: Square): Square[] {
  const piece = state.squares[from];

  if (!piece || piece.color !== state.turn) {
    return [];
  }

  return getPseudoMoves(state, from, false).filter((to) => {
    const nextState = applyMoveUnchecked(state, from, to);

    return !isKingInCheck(nextState, piece.color);
  });
}

export function applyMove(
  state: BoardState,
  from: Square,
  to: Square,
  promotion: "queen" | "rook" | "bishop" | "knight" = "queen"
): BoardState {
  if (!getLegalMoves(state, from).includes(to)) {
    throw new Error(`Illegal move: ${from}-${to}`);
  }

  return applyMoveUnchecked(state, from, to, promotion);
}

export function getGameStatus(state: BoardState): "ongoing" | "checkmate" | "stalemate" | "draw" {
  const hasLegalMove = allSquares().some((square) => getLegalMoves(state, square).length > 0);

  if (!hasLegalMove) {
    return isKingInCheck(state, state.turn) ? "checkmate" : "stalemate";
  }

  if (state.halfmoveClock >= 100 || hasInsufficientMaterial(state)) {
    return "draw";
  }

  return "ongoing";
}

function applyMoveUnchecked(
  state: BoardState,
  from: Square,
  to: Square,
  promotion: "queen" | "rook" | "bishop" | "knight" = "queen"
): BoardState {
  const piece = state.squares[from];

  if (!piece) {
    throw new Error(`No piece on ${from}`);
  }

  const nextSquares = copySquares(state.squares);
  const fromCoord = toCoord(from);
  const toCoordValue = toCoord(to);
  const target = nextSquares[to];
  const isPawn = piece.type === "pawn";
  const direction = piece.color === "white" ? 1 : -1;
  const isEnPassantCapture =
    isPawn && state.enPassant === to && !target && fromCoord.file !== toCoordValue.file;
  const capturedSquare = isEnPassantCapture
    ? toSquare(toCoordValue.file, toCoordValue.rank - direction)
    : to;
  const capturedPiece = state.squares[capturedSquare];

  nextSquares[from] = null;

  if (isEnPassantCapture) {
    nextSquares[capturedSquare] = null;
  }

  if (piece.type === "king" && Math.abs(toCoordValue.file - fromCoord.file) === 2) {
    const rank = piece.color === "white" ? 0 : 7;

    if (toCoordValue.file === 6) {
      nextSquares[toSquare(5, rank)] = nextSquares[toSquare(7, rank)];
      nextSquares[toSquare(7, rank)] = null;
    } else {
      nextSquares[toSquare(3, rank)] = nextSquares[toSquare(0, rank)];
      nextSquares[toSquare(0, rank)] = null;
    }
  }

  const promotedPiece =
    isPawn && (toCoordValue.rank === 0 || toCoordValue.rank === 7)
      ? { type: promotionTypes.has(promotion) ? promotion : "queen", color: piece.color }
      : piece;

  nextSquares[to] = { ...promotedPiece };

  return {
    squares: nextSquares,
    turn: opposite(piece.color),
    castling: updateCastlingRights(state.castling, piece, from, capturedPiece, capturedSquare),
    enPassant:
      isPawn && Math.abs(toCoordValue.rank - fromCoord.rank) === 2
        ? toSquare(fromCoord.file, fromCoord.rank + direction)
        : null,
    halfmoveClock: isPawn || capturedPiece ? 0 : state.halfmoveClock + 1,
    fullmoveNumber: piece.color === "black" ? state.fullmoveNumber + 1 : state.fullmoveNumber
  };
}

function getPseudoMoves(state: BoardState, from: Square, attacksOnly: boolean): Square[] {
  const piece = state.squares[from];

  if (!piece) {
    return [];
  }

  if (piece.type === "pawn") {
    return getPawnMoves(state, from, piece, attacksOnly);
  }

  if (piece.type === "knight") {
    return getStepMoves(state, from, piece, attacksOnly, [
      [1, 2],
      [2, 1],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-2, 1],
      [-1, 2]
    ]);
  }

  if (piece.type === "bishop") {
    return getSlidingMoves(state, from, piece, attacksOnly, [
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1]
    ]);
  }

  if (piece.type === "rook") {
    return getSlidingMoves(state, from, piece, attacksOnly, [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0]
    ]);
  }

  if (piece.type === "queen") {
    return getSlidingMoves(state, from, piece, attacksOnly, [
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, -1],
      [-1, 0],
      [-1, 1]
    ]);
  }

  return [
    ...getStepMoves(state, from, piece, attacksOnly, [
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, -1],
      [-1, 0],
      [-1, 1]
    ]),
    ...(attacksOnly ? [] : getCastlingMoves(state, from, piece))
  ];
}

function getPawnMoves(state: BoardState, from: Square, piece: Piece, attacksOnly: boolean): Square[] {
  const moves: Square[] = [];
  const { file, rank } = toCoord(from);
  const direction = piece.color === "white" ? 1 : -1;
  const startRank = piece.color === "white" ? 1 : 6;

  for (const fileDelta of [-1, 1]) {
    const target = toSquareOrNull(file + fileDelta, rank + direction);

    if (!target) {
      continue;
    }

    const occupant = state.squares[target];

    if (attacksOnly || (occupant && occupant.color !== piece.color) || state.enPassant === target) {
      moves.push(target);
    }
  }

  if (attacksOnly) {
    return moves;
  }

  const oneStep = toSquareOrNull(file, rank + direction);

  if (oneStep && !state.squares[oneStep]) {
    moves.push(oneStep);

    const twoStep = toSquareOrNull(file, rank + direction * 2);

    if (rank === startRank && twoStep && !state.squares[twoStep]) {
      moves.push(twoStep);
    }
  }

  return moves;
}

function getStepMoves(
  state: BoardState,
  from: Square,
  piece: Piece,
  attacksOnly: boolean,
  deltas: Array<[number, number]>
): Square[] {
  const { file, rank } = toCoord(from);

  return deltas.flatMap(([fileDelta, rankDelta]) => {
    const target = toSquareOrNull(file + fileDelta, rank + rankDelta);

    if (!target) {
      return [];
    }

    const occupant = state.squares[target];

    return attacksOnly || !occupant || occupant.color !== piece.color ? [target] : [];
  });
}

function getSlidingMoves(
  state: BoardState,
  from: Square,
  piece: Piece,
  attacksOnly: boolean,
  deltas: Array<[number, number]>
): Square[] {
  const moves: Square[] = [];
  const origin = toCoord(from);

  for (const [fileDelta, rankDelta] of deltas) {
    let file = origin.file + fileDelta;
    let rank = origin.rank + rankDelta;

    while (isOnBoard(file, rank)) {
      const target = toSquare(file, rank);
      const occupant = state.squares[target];

      if (!occupant) {
        moves.push(target);
      } else {
        if (attacksOnly || occupant.color !== piece.color) {
          moves.push(target);
        }

        break;
      }

      file += fileDelta;
      rank += rankDelta;
    }
  }

  return moves;
}

function getCastlingMoves(state: BoardState, from: Square, piece: Piece): Square[] {
  if (piece.type !== "king" || isKingInCheck(state, piece.color)) {
    return [];
  }

  const rank = piece.color === "white" ? 0 : 7;
  const start = toSquare(4, rank);

  if (from !== start) {
    return [];
  }

  const opponent = opposite(piece.color);
  const moves: Square[] = [];

  const maybeAdd = (
    right: CastlingKey,
    rookFrom: Square,
    emptySquares: Square[],
    safeSquares: Square[],
    destination: Square
  ) => {
    const rook = state.squares[rookFrom];

    if (
      state.castling[right] &&
      rook?.type === "rook" &&
      rook.color === piece.color &&
      emptySquares.every((square) => !state.squares[square]) &&
      safeSquares.every((square) => !isSquareAttacked(state, square, opponent))
    ) {
      moves.push(destination);
    }
  };

  maybeAdd(
    piece.color === "white" ? "whiteKingside" : "blackKingside",
    toSquare(7, rank),
    [toSquare(5, rank), toSquare(6, rank)],
    [toSquare(5, rank), toSquare(6, rank)],
    toSquare(6, rank)
  );
  maybeAdd(
    piece.color === "white" ? "whiteQueenside" : "blackQueenside",
    toSquare(0, rank),
    [toSquare(1, rank), toSquare(2, rank), toSquare(3, rank)],
    [toSquare(3, rank), toSquare(2, rank)],
    toSquare(2, rank)
  );

  return moves;
}

function isKingInCheck(state: BoardState, color: Color): boolean {
  const kingSquare = allSquares().find((square) => {
    const piece = state.squares[square];

    return piece?.type === "king" && piece.color === color;
  });

  if (!kingSquare) {
    throw new Error(`Invalid board: missing ${color} king`);
  }

  return isSquareAttacked(state, kingSquare, opposite(color));
}

function isSquareAttacked(state: BoardState, square: Square, byColor: Color): boolean {
  return allSquares().some((from) => {
    const piece = state.squares[from];

    return piece?.color === byColor && getPseudoMoves(state, from, true).includes(square);
  });
}

function updateCastlingRights(
  castling: BoardState["castling"],
  movedPiece: Piece,
  from: Square,
  capturedPiece: Piece | null,
  capturedSquare: Square
): BoardState["castling"] {
  const next = { ...castling };

  if (movedPiece.type === "king") {
    setCastling(next, movedPiece.color, false, false);
  }

  if (movedPiece.type === "rook") {
    disableRookCastling(next, from);
  }

  if (capturedPiece?.type === "rook") {
    disableRookCastling(next, capturedSquare);
  }

  return next;
}

function disableRookCastling(castling: BoardState["castling"], square: Square): void {
  if (square === "h1") {
    castling.whiteKingside = false;
  } else if (square === "a1") {
    castling.whiteQueenside = false;
  } else if (square === "h8") {
    castling.blackKingside = false;
  } else if (square === "a8") {
    castling.blackQueenside = false;
  }
}

function setCastling(
  castling: BoardState["castling"],
  color: Color,
  kingside: boolean,
  queenside: boolean
): void {
  if (color === "white") {
    castling.whiteKingside = kingside;
    castling.whiteQueenside = queenside;
  } else {
    castling.blackKingside = kingside;
    castling.blackQueenside = queenside;
  }
}

function hasInsufficientMaterial(state: BoardState): boolean {
  const pieces = allSquares()
    .map((square) => ({ square, piece: state.squares[square] }))
    .filter(({ piece }) => piece && piece.type !== "king") as Array<{ square: Square; piece: Piece }>;

  if (pieces.length === 0) {
    return true;
  }

  if (pieces.length === 1) {
    return pieces[0].piece.type === "bishop" || pieces[0].piece.type === "knight";
  }

  return pieces.every(({ piece }) => piece.type === "bishop") && allBishopsOnSameColor(pieces);
}

function allBishopsOnSameColor(pieces: Array<{ square: Square; piece: Piece }>): boolean {
  const [first, ...rest] = pieces;
  const firstColor = squareColor(first.square);

  return rest.every(({ square }) => squareColor(square) === firstColor);
}

function squareColor(square: Square): "light" | "dark" {
  const { file, rank } = toCoord(square);

  return (file + rank) % 2 === 0 ? "dark" : "light";
}

function createEmptySquares(): Record<Square, Piece | null> {
  return Object.fromEntries(allSquares().map((square) => [square, null])) as Record<Square, Piece | null>;
}

function copySquares(squares: Record<Square, Piece | null>): Record<Square, Piece | null> {
  return Object.fromEntries(
    allSquares().map((square) => {
      const piece = squares[square];

      return [square, piece ? { ...piece } : null];
    })
  ) as Record<Square, Piece | null>;
}

function allSquares(): Square[] {
  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
}

function assertSquare(value: string): Square {
  if (!/^[a-h][1-8]$/.test(value)) {
    throw new Error("Invalid square");
  }

  return value as Square;
}

function toCoord(square: Square): { file: number; rank: number } {
  return {
    file: files.indexOf(square[0] as File),
    rank: ranks.indexOf(square[1] as Rank)
  };
}

function toSquare(file: number, rank: number): Square {
  const square = toSquareOrNull(file, rank);

  if (!square) {
    throw new Error("Coordinates are outside the board");
  }

  return square;
}

function toSquareOrNull(file: number, rank: number): Square | null {
  return isOnBoard(file, rank) ? `${files[file]}${ranks[rank]}` : null;
}

function isOnBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

function opposite(color: Color): Color {
  return color === "white" ? "black" : "white";
}
