import {
  applyMove,
  getGameStatus,
  getLegalMoves,
  parseFEN,
  toFEN,
  type BoardState,
  type Piece,
  type PieceType,
  type Square
} from "@chess-platform/chess-engine";
import { Injectable } from "@nestjs/common";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createRequire } from "node:module";
import { createInterface } from "node:readline";
import { type GameAnalysisEntry } from "./schemas/game.schema";

type Move = {
  from: Square;
  to: Square;
  promotion?: "queen" | "rook" | "bishop" | "knight";
};

type StockfishSearchResult = {
  bestMove: string;
  scoreCp: number;
};

type LineWaiter = {
  predicate: (line: string) => boolean;
  resolve: () => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type SearchWaiter = {
  lastScoreCp: number;
  resolve: (result: StockfishSearchResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const requireFromHere = createRequire(__filename);
const enginePath = requireFromHere.resolve("stockfish/bin/stockfish-18-lite-single.js");
const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const analysisDepth = 18;
const centipawnMistakeThreshold = 50;
const engineTimeoutMs = 120_000;

@Injectable()
export class StockfishAnalysisService {
  async analyzePgn(pgn: string): Promise<GameAnalysisEntry[]> {
    const engine = await StockfishEngine.create();

    try {
      return await analyzeMoves(pgn, engine);
    } finally {
      engine.close();
    }
  }
}

async function analyzeMoves(pgn: string, engine: StockfishEngine): Promise<GameAnalysisEntry[]> {
  const moveTokens = tokenizeMoves(pgn);
  const analysis: GameAnalysisEntry[] = [];
  let state = parseFEN(initialFen);

  for (const [index, token] of moveTokens.entries()) {
    const playedMove = resolveMove(state, token);
    const best = await engine.search(toFEN(state), analysisDepth);
    const bestMove = parseUciMove(best.bestMove);
    const nextState = applyMove(state, playedMove.from, playedMove.to, playedMove.promotion);
    const playedResponse = await engine.search(toFEN(nextState), analysisDepth);
    const playedScoreForMover = -playedResponse.scoreCp;
    const centipawnLoss = best.scoreCp - playedScoreForMover;
    const bestMoveMatches =
      bestMove?.from === playedMove.from &&
      bestMove.to === playedMove.to &&
      (bestMove.promotion ?? "queen") === (playedMove.promotion ?? "queen");
    const mistake = !bestMoveMatches && centipawnLoss > centipawnMistakeThreshold;

    analysis.push({
      move: index + 1,
      mistake,
      suggestion: mistake && bestMove ? formatSanMove(state, bestMove) : ""
    });

    state = nextState;
  }

  return analysis;
}

class StockfishEngine {
  private readonly lineWaiters: LineWaiter[] = [];
  private currentSearch: SearchWaiter | null = null;

  private constructor(private readonly child: ChildProcessWithoutNullStreams) {
    createInterface({ input: child.stdout }).on("line", (line) => {
      this.handleLine(line.trim());
    });

    child.on("exit", () => {
      this.rejectAll(new Error("Stockfish process exited"));
    });

    child.on("error", (error) => {
      this.rejectAll(error);
    });
  }

  static async create(): Promise<StockfishEngine> {
    const child = spawn(process.execPath, [enginePath], {
      stdio: "pipe"
    });
    const engine = new StockfishEngine(child);

    engine.send("uci");
    await engine.waitFor((line) => line === "uciok");
    engine.send("isready");
    await engine.waitFor((line) => line === "readyok");

    return engine;
  }

  async search(fen: string, depth: number): Promise<StockfishSearchResult> {
    if (this.currentSearch) {
      throw new Error("Stockfish search already in progress");
    }

    return new Promise((resolve, reject) => {
      this.currentSearch = {
        lastScoreCp: 0,
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.currentSearch = null;
          reject(new Error("Stockfish search timed out"));
        }, engineTimeoutMs)
      };

      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  close(): void {
    this.send("quit");
    this.child.kill();
  }

  private waitFor(predicate: (line: string) => boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      this.lineWaiters.push({
        predicate,
        resolve,
        reject,
        timeout: setTimeout(() => {
          reject(new Error("Stockfish initialization timed out"));
        }, engineTimeoutMs)
      });
    });
  }

  private send(command: string): void {
    this.child.stdin.write(`${command}\n`);
  }

  private handleLine(line: string): void {
    for (const waiter of [...this.lineWaiters]) {
      if (waiter.predicate(line)) {
        clearTimeout(waiter.timeout);
        this.lineWaiters.splice(this.lineWaiters.indexOf(waiter), 1);
        waiter.resolve();
      }
    }

    if (!this.currentSearch) {
      return;
    }

    const score = parseScore(line);

    if (score !== null) {
      this.currentSearch.lastScoreCp = score;
    }

    if (line.startsWith("bestmove ")) {
      const bestMove = line.split(/\s+/)[1];
      const search = this.currentSearch;

      clearTimeout(search.timeout);
      this.currentSearch = null;
      search.resolve({
        bestMove,
        scoreCp: search.lastScoreCp
      });
    }
  }

  private rejectAll(error: Error): void {
    for (const waiter of this.lineWaiters.splice(0)) {
      clearTimeout(waiter.timeout);
      waiter.reject(error);
    }

    if (this.currentSearch) {
      clearTimeout(this.currentSearch.timeout);
      this.currentSearch.reject(error);
      this.currentSearch = null;
    }
  }
}

function parseScore(line: string): number | null {
  const cpMatch = line.match(/\bscore cp (-?\d+)/);

  if (cpMatch) {
    return Number(cpMatch[1]);
  }

  const mateMatch = line.match(/\bscore mate (-?\d+)/);

  if (!mateMatch) {
    return null;
  }

  const mate = Number(mateMatch[1]);

  return Math.sign(mate) * (100_000 - Math.abs(mate) * 1_000);
}

function tokenizeMoves(pgn: string): string[] {
  return pgn
    .replace(/\{[^}]*}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !/^\d+\.+$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token));
}

function resolveMove(state: BoardState, token: string): Move {
  const coordinateMove = parseCoordinateMove(token);

  if (coordinateMove) {
    return coordinateMove;
  }

  const sanMove = parseSanMove(state, token);

  if (sanMove) {
    return sanMove;
  }

  throw new Error(`Unsupported move notation: ${token}`);
}

function parseCoordinateMove(token: string): Move | null {
  const squares = token.match(/[a-h][1-8]/g);

  if (!squares || squares.length < 2) {
    return null;
  }

  return {
    from: squares[0] as Square,
    to: squares[1] as Square,
    promotion: parsePromotion(token)
  };
}

function parseSanMove(state: BoardState, token: string): Move | null {
  const normalized = token.replace(/[+#?!]+$/g, "");

  if (normalized === "O-O" || normalized === "0-0") {
    return castleMove(state, "kingside");
  }

  if (normalized === "O-O-O" || normalized === "0-0-0") {
    return castleMove(state, "queenside");
  }

  const match = normalized.match(/^([KQRBN])?([a-h])?([1-8])?x?([a-h][1-8])(?:=([QRBN]))?$/);

  if (!match) {
    return null;
  }

  const pieceType = sanPieceType(match[1]);
  const fromFile = match[2];
  const fromRank = match[3];
  const to = match[4] as Square;
  const promotion = sanPromotion(match[5]);
  const candidates = allSquares().filter((from) => {
    const piece = state.squares[from];

    return (
      piece?.color === state.turn &&
      piece.type === pieceType &&
      (!fromFile || from.startsWith(fromFile)) &&
      (!fromRank || from.endsWith(fromRank)) &&
      getLegalMoves(state, from).includes(to)
    );
  });

  if (candidates.length !== 1) {
    return null;
  }

  return {
    from: candidates[0],
    to,
    promotion
  };
}

function castleMove(state: BoardState, side: "kingside" | "queenside"): Move | null {
  const from = state.turn === "white" ? "e1" : "e8";
  const to = `${side === "kingside" ? "g" : "c"}${state.turn === "white" ? "1" : "8"}` as Square;

  return getLegalMoves(state, from).includes(to) ? { from, to } : null;
}

function parseUciMove(move: string): Move | null {
  const from = move.slice(0, 2);
  const to = move.slice(2, 4);

  if (!isSquare(from) || !isSquare(to)) {
    return null;
  }

  return {
    from,
    to,
    promotion: parsePromotion(move)
  };
}

function formatSanMove(state: BoardState, move: Move): string {
  const piece = state.squares[move.from];

  if (!piece) {
    return `${move.from}${move.to}`;
  }

  if (piece.type === "king" && move.from[0] === "e" && move.to[0] === "g") {
    return "O-O";
  }

  if (piece.type === "king" && move.from[0] === "e" && move.to[0] === "c") {
    return "O-O-O";
  }

  const capture = isCapture(state, move, piece);
  const prefix = piece.type === "pawn" ? "" : sanPieceLetter(piece.type);
  const disambiguation = piece.type === "pawn" ? "" : getDisambiguation(state, move, piece);
  const pawnCaptureFile = piece.type === "pawn" && capture ? move.from[0] : "";
  const promotion = move.promotion ? `=${sanPieceLetter(move.promotion)}` : "";
  const nextState = applyMove(state, move.from, move.to, move.promotion);
  const suffix = getGameStatus(nextState) === "checkmate" ? "#" : "";

  return `${prefix}${disambiguation}${pawnCaptureFile}${capture ? "x" : ""}${move.to}${promotion}${suffix}`;
}

function getDisambiguation(state: BoardState, move: Move, piece: Piece): string {
  const matchingOrigins = allSquares().filter((square) => {
    const candidate = state.squares[square];

    return (
      square !== move.from &&
      candidate?.color === piece.color &&
      candidate.type === piece.type &&
      getLegalMoves(state, square).includes(move.to)
    );
  });

  if (matchingOrigins.length === 0) {
    return "";
  }

  const sharesFile = matchingOrigins.some((square) => square[0] === move.from[0]);
  const sharesRank = matchingOrigins.some((square) => square[1] === move.from[1]);

  if (!sharesFile) {
    return move.from[0];
  }

  if (!sharesRank) {
    return move.from[1];
  }

  return move.from;
}

function isCapture(state: BoardState, move: Move, piece: Piece): boolean {
  return Boolean(state.squares[move.to]) || (piece.type === "pawn" && state.enPassant === move.to);
}

function parsePromotion(token: string): "queen" | "rook" | "bishop" | "knight" | undefined {
  const match = token.match(/[=]?([QRBNqrbn])$/);

  return match ? sanPromotion(match[1]) : undefined;
}

function sanPromotion(value: string | undefined): "queen" | "rook" | "bishop" | "knight" | undefined {
  if (!value) {
    return undefined;
  }

  if (value.toUpperCase() === "Q") {
    return "queen";
  }

  if (value.toUpperCase() === "R") {
    return "rook";
  }

  if (value.toUpperCase() === "B") {
    return "bishop";
  }

  if (value.toUpperCase() === "N") {
    return "knight";
  }

  return undefined;
}

function sanPieceType(value: string | undefined): PieceType {
  if (value === "K") {
    return "king";
  }

  if (value === "Q") {
    return "queen";
  }

  if (value === "R") {
    return "rook";
  }

  if (value === "B") {
    return "bishop";
  }

  if (value === "N") {
    return "knight";
  }

  return "pawn";
}

function sanPieceLetter(type: PieceType): string {
  if (type === "knight") {
    return "N";
  }

  return type === "pawn" ? "" : type.charAt(0).toUpperCase();
}

function isSquare(value: string): value is Square {
  return /^[a-h][1-8]$/.test(value);
}

function allSquares(): Square[] {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
}
