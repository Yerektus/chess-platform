"use client";

import {
  applyMove,
  getLegalMoves,
  parseFEN,
  type BoardState,
  type Color,
  type PieceType,
  type Square
} from "@chess-platform/chess-engine";
import { Button, Card, ChessBoard } from "@chess-platform/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { type GameHistoryEntry } from "@/lib/auth-types";
import { useCallback, useEffect, useMemo, useState } from "react";

type ReviewGameProps = {
  id: string;
};

type Move = {
  from: Square;
  to: Square;
  notation: string;
  moveNumber: number;
  color: Color;
  promotion?: "queen" | "rook" | "bishop" | "knight";
};

type ReplayState = {
  state: BoardState;
  lastMove: { from: Square; to: Square } | null;
};

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function ReviewGame({ id }: ReviewGameProps) {
  const { accessToken, isLoading } = useAuth();
  const [game, setGame] = useState<GameHistoryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPly, setCurrentPly] = useState(0);
  const [selectedMistakeMove, setSelectedMistakeMove] = useState<number | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const fetchGame = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const response = await fetch(`${getApiBaseUrl()}/games/${id}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const payload = (await response.json().catch(() => null)) as GameHistoryEntry | { message?: string } | null;

    if (!response.ok || !payload || !("id" in payload)) {
      throw new Error(payload && "message" in payload ? payload.message : "Failed to load game");
    }

    setGame(payload);
    setError(null);
  }, [accessToken, id]);

  useEffect(() => {
    if (isLoading || !accessToken) {
      return;
    }

    void fetchGame().catch((fetchError) => {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load game");
    });
  }, [accessToken, fetchGame, isLoading]);

  const moves = useMemo(() => replayMoves(game?.pgn ?? ""), [game?.pgn]);
  const analysisReady = !game || moves.length === 0 || game.analysis.length >= moves.length;

  useEffect(() => {
    if (!game || analysisReady || !accessToken) {
      return undefined;
    }

    const interval = setInterval(() => {
      void fetchGame().catch(() => undefined);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [accessToken, analysisReady, fetchGame, game]);

  useEffect(() => {
    setCurrentPly((ply) => Math.min(ply, moves.length));
  }, [moves.length]);

  const replay = useMemo(() => buildReplay(moves, currentPly), [currentPly, moves]);
  const rows = useMemo(() => toMoveRows(moves, game?.analysis ?? []), [game?.analysis, moves]);
  const selectedSuggestion = selectedMistakeMove
    ? game?.analysis.find((entry) => entry.move === selectedMistakeMove && entry.mistake)?.suggestion
    : null;

  if (isLoading) {
    return <StatusPage text="Loading game" />;
  }

  if (error) {
    return <StatusPage text={error} />;
  }

  if (!game) {
    return <StatusPage text="Loading game" />;
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex w-full max-w-[min(calc(100vw_-_48px),560px)] flex-col gap-3 self-center lg:self-start">
          <PlayerLabel color="black" active={replay.state.turn === "black"} />
          <ChessBoard
            lastMove={replay.lastMove}
            legalMoves={[]}
            onSquareClick={() => undefined}
            orientation="white"
            selectedSquare={null}
            state={replay.state}
          />
          <PlayerLabel color="white" active={replay.state.turn === "white"} />
        </section>

        <div className="lg:hidden">
          <Button className="min-h-11 w-full" onClick={() => setShowMobileSidebar((visible) => !visible)} variant="ghost">
            {showMobileSidebar ? "Close" : "Show moves"}
          </Button>
        </div>

        <aside
          className={
            showMobileSidebar
              ? "flex w-full flex-col gap-4 lg:w-[320px]"
              : "hidden w-full flex-col gap-4 lg:flex lg:w-[320px]"
          }
        >
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-[18px] font-medium leading-[1.2]">Game review</h2>
              <p className="mt-1 font-mono text-[13px] text-[var(--color-text-secondary)]">
                Move {currentPly} of {moves.length}
              </p>
              {!analysisReady ? (
                <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">Analysis in progress</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button disabled={currentPly === 0} onClick={() => setCurrentPly((ply) => Math.max(0, ply - 1))} variant="ghost">
                Previous
              </Button>
              <Button
                disabled={currentPly === moves.length}
                onClick={() => setCurrentPly((ply) => Math.min(moves.length, ply + 1))}
                variant="ghost"
              >
                Next
              </Button>
            </div>

            <MoveHistory rows={rows} selectedPly={currentPly} onMistakeClick={setSelectedMistakeMove} />

            {selectedSuggestion ? (
              <section className="rounded-[6px] border border-[var(--color-border)] p-3">
                <p className="text-[15px] text-[var(--color-text-primary)]">Better move: {selectedSuggestion}</p>
              </section>
            ) : null}
          </Card>
        </aside>
      </div>
    </main>
  );
}

function StatusPage({ text }: { text: string }) {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
      <div className="mx-auto max-w-[1200px]">
        <Card>
          <p className="text-[15px] text-[var(--color-text-secondary)]">{text}</p>
        </Card>
      </div>
    </main>
  );
}

function PlayerLabel({ color, active }: { color: Color; active: boolean }) {
  return (
    <div className="flex h-10 items-center justify-between rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      <span className="text-[15px] font-medium">{capitalize(color)}</span>
      <span className="text-[13px] text-[var(--color-text-secondary)]">{active ? "To move" : "Waiting"}</span>
    </div>
  );
}

function MoveHistory({
  onMistakeClick,
  rows,
  selectedPly
}: {
  onMistakeClick: (move: number) => void;
  rows: Array<{
    moveNumber: number;
    white: MoveCell;
    black: MoveCell;
  }>;
  selectedPly: number;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[15px] font-medium">Move history</h3>
      <div className="max-h-[328px] overflow-y-auto rounded-[6px] border border-[var(--color-border)]">
        <table className="w-full border-collapse font-mono text-[13px]">
          <thead className="text-[var(--color-text-secondary)]">
            <tr>
              <th className="w-10 px-2 py-2 text-left font-normal">No.</th>
              <th className="px-2 py-2 text-left font-normal">White</th>
              <th className="px-2 py-2 text-left font-normal">Black</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr className={row.white.ply === selectedPly || row.black.ply === selectedPly ? "bg-[var(--color-border)]" : undefined} key={row.moveNumber}>
                  <td className="px-2 py-2 text-[var(--color-text-secondary)]">{row.moveNumber}</td>
                  <MoveHistoryCell cell={row.white} onMistakeClick={onMistakeClick} />
                  <MoveHistoryCell cell={row.black} onMistakeClick={onMistakeClick} />
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-2 py-4 text-[var(--color-text-secondary)]" colSpan={3}>
                  No moves
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type MoveCell = {
  analysisMove: number;
  notation: string;
  moveNumber: number;
  ply: number;
  mistake: boolean;
};

function MoveHistoryCell({ cell, onMistakeClick }: { cell: MoveCell; onMistakeClick: (move: number) => void }) {
  if (!cell.notation) {
    return <td className="px-2 py-2" />;
  }

  return (
    <td className={cell.mistake ? "bg-[rgba(200,50,50,0.15)] px-2 py-2" : "px-2 py-2"}>
      <button
        className="block w-full text-left"
        disabled={!cell.mistake}
        onClick={() => onMistakeClick(cell.analysisMove)}
        type="button"
      >
        <span>{cell.notation}</span>
        {cell.mistake ? (
          <span className="mt-1 block font-sans text-[13px] text-[var(--color-text-secondary)]">Mistake</span>
        ) : null}
      </button>
    </td>
  );
}

function replayMoves(pgn: string): Move[] {
  const tokens = tokenizeMoves(pgn);
  const moves: Move[] = [];
  let state = parseFEN(initialFen);

  for (const token of tokens) {
    const move = resolveMove(state, token);
    const piece = state.squares[move.from];

    moves.push({
      ...move,
      color: piece?.color ?? state.turn,
      moveNumber: state.fullmoveNumber,
      notation: token
    });
    state = applyMove(state, move.from, move.to, move.promotion);
  }

  return moves;
}

function buildReplay(moves: Move[], currentPly: number): ReplayState {
  let state = parseFEN(initialFen);
  let lastMove: { from: Square; to: Square } | null = null;

  for (const move of moves.slice(0, currentPly)) {
    state = applyMove(state, move.from, move.to, move.promotion);
    lastMove = {
      from: move.from,
      to: move.to
    };
  }

  return { state, lastMove };
}

function toMoveRows(
  moves: Move[],
  analysis: GameHistoryEntry["analysis"]
): Array<{ moveNumber: number; white: MoveCell; black: MoveCell }> {
  const rows = new Map<number, { moveNumber: number; white: MoveCell; black: MoveCell }>();

  for (const [index, move] of moves.entries()) {
    const row = rows.get(move.moveNumber) ?? {
      moveNumber: move.moveNumber,
      white: emptyCell(move.moveNumber),
      black: emptyCell(move.moveNumber)
    };
    const analysisEntry = analysis[index];
    const cell: MoveCell = {
      analysisMove: analysisEntry?.move ?? index + 1,
      notation: move.notation,
      moveNumber: move.moveNumber,
      ply: index + 1,
      mistake: Boolean(analysisEntry?.mistake)
    };

    if (move.color === "white") {
      row.white = cell;
    } else {
      row.black = cell;
    }

    rows.set(move.moveNumber, row);
  }

  return [...rows.values()];
}

function emptyCell(moveNumber: number): MoveCell {
  return {
    analysisMove: 0,
    notation: "",
    moveNumber,
    ply: 0,
    mistake: false
  };
}

function tokenizeMoves(pgn: string): string[] {
  return pgn
    .replace(/\{[^}]*}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !/^\d+\.+$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token));
}

function resolveMove(state: BoardState, token: string): {
  from: Square;
  to: Square;
  promotion?: "queen" | "rook" | "bishop" | "knight";
} {
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

function parseCoordinateMove(token: string): {
  from: Square;
  to: Square;
  promotion?: "queen" | "rook" | "bishop" | "knight";
} | null {
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

function parseSanMove(
  state: BoardState,
  token: string
): { from: Square; to: Square; promotion?: "queen" | "rook" | "bishop" | "knight" } | null {
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

function castleMove(
  state: BoardState,
  side: "kingside" | "queenside"
): { from: Square; to: Square } | null {
  const from = state.turn === "white" ? "e1" : "e8";
  const to = `${side === "kingside" ? "g" : "c"}${state.turn === "white" ? "1" : "8"}` as Square;

  return getLegalMoves(state, from).includes(to) ? { from, to } : null;
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

function allSquares(): Square[] {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
