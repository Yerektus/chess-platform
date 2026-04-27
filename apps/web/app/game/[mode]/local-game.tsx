"use client";

import {
  applyMove,
  getGameStatus,
  getLegalMoves,
  parseFEN,
  type BoardState,
  type Color,
  type Piece,
  type PieceType,
  type Square
} from "@chess-platform/chess-engine";
import { Button, Card, ChessBoard, Modal } from "@chess-platform/ui";
import { useMemo, useState } from "react";

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

type LastMove = {
  from: Square;
  to: Square;
};

type MoveRecord = LastMove & {
  moveNumber: number;
  color: Color;
  notation: string;
};

type CapturedPiece = {
  piece: Piece;
  capturedBy: Color;
};

const pieceNotation: Record<PieceType, string> = {
  king: "K",
  queen: "Q",
  rook: "R",
  bishop: "B",
  knight: "N",
  pawn: ""
};

const pieceName: Record<PieceType, string> = {
  king: "King",
  queen: "Queen",
  rook: "Rook",
  bishop: "Bishop",
  knight: "Knight",
  pawn: "Pawn"
};

export function LocalGame() {
  const [state, setState] = useState<BoardState>(() => parseFEN(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const legalMoves = useMemo(
    () => (selectedSquare ? getLegalMoves(state, selectedSquare) : []),
    [selectedSquare, state]
  );
  const moveRows = useMemo(() => toMoveRows(moveHistory), [moveHistory]);

  const resetGame = () => {
    setState(parseFEN(initialFen));
    setSelectedSquare(null);
    setMoveHistory([]);
    setCapturedPieces([]);
    setLastMove(null);
    setResult(null);
  };

  const handleSquareClick = (square: Square) => {
    if (result) {
      return;
    }

    if (selectedSquare && legalMoves.includes(square)) {
      const movingPiece = state.squares[selectedSquare];

      if (!movingPiece) {
        setSelectedSquare(null);
        return;
      }

      const capturedPiece = findCapturedPiece(state, selectedSquare, square);
      const nextState = applyMove(state, selectedSquare, square);
      const nextStatus = getGameStatus(nextState);
      const notation = formatMove(movingPiece, selectedSquare, square, Boolean(capturedPiece));

      setState(nextState);
      setMoveHistory((history) => [
        ...history,
        {
          from: selectedSquare,
          to: square,
          moveNumber: state.fullmoveNumber,
          color: movingPiece.color,
          notation
        }
      ]);

      if (capturedPiece) {
        setCapturedPieces((pieces) => [
          ...pieces,
          {
            piece: capturedPiece,
            capturedBy: movingPiece.color
          }
        ]);
      }

      setLastMove({ from: selectedSquare, to: square });
      setSelectedSquare(null);

      if (nextStatus === "checkmate") {
        setResult(`${capitalize(movingPiece.color)} wins by checkmate`);
      } else if (nextStatus === "stalemate") {
        setResult("Draw by stalemate");
      }

      return;
    }

    const piece = state.squares[square];

    setSelectedSquare(piece?.color === state.turn ? square : null);
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex w-full max-w-[560px] flex-col gap-3">
          <PlayerLabel color="black" active={state.turn === "black"} />
          <ChessBoard
            lastMove={lastMove}
            legalMoves={legalMoves}
            onSquareClick={handleSquareClick}
            orientation="white"
            selectedSquare={selectedSquare}
            state={state}
          />
          <PlayerLabel color="white" active={state.turn === "white"} />
        </section>

        <aside className="flex w-full flex-col gap-4 lg:w-[280px]">
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-[18px] font-medium leading-[1.2]">Local game</h2>
              <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                {capitalize(state.turn)} to move
              </p>
            </div>

            <CapturedPieces pieces={capturedPieces} />
            <MoveHistory rows={moveRows} currentMoveNumber={state.fullmoveNumber} />

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setResult(`${capitalize(state.turn)} resigned`)} variant="ghost">
                Resign
              </Button>
              <Button onClick={() => setResult("Draw offered")} variant="ghost">
                Offer Draw
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <Modal onClose={() => setResult(null)} open={Boolean(result)} title="Game result">
        <div className="flex flex-col gap-6">
          <p className="text-[15px] text-[var(--color-text-primary)]">{result}</p>
          <Button onClick={resetGame}>New game</Button>
        </div>
      </Modal>
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

function CapturedPieces({ pieces }: { pieces: CapturedPiece[] }) {
  const whiteCaptures = pieces.filter((entry) => entry.capturedBy === "white");
  const blackCaptures = pieces.filter((entry) => entry.capturedBy === "black");

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[15px] font-medium">Captured pieces</h3>
      <CapturedLine label="White" pieces={whiteCaptures} />
      <CapturedLine label="Black" pieces={blackCaptures} />
    </section>
  );
}

function CapturedLine({ label, pieces }: { label: string; pieces: CapturedPiece[] }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-right text-[var(--color-text-primary)]">
        {pieces.length > 0 ? pieces.map(({ piece }) => pieceName[piece.type]).join(", ") : "None"}
      </span>
    </div>
  );
}

function MoveHistory({
  rows,
  currentMoveNumber
}: {
  rows: Array<{ moveNumber: number; white: string; black: string }>;
  currentMoveNumber: number;
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
                <tr
                  className={row.moveNumber === currentMoveNumber ? "bg-[var(--color-border)]" : undefined}
                  key={row.moveNumber}
                >
                  <td className="px-2 py-2 text-[var(--color-text-secondary)]">{row.moveNumber}</td>
                  <td className="px-2 py-2">{row.white}</td>
                  <td className="px-2 py-2">{row.black}</td>
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

function toMoveRows(history: MoveRecord[]): Array<{ moveNumber: number; white: string; black: string }> {
  const rows = new Map<number, { moveNumber: number; white: string; black: string }>();

  for (const move of history) {
    const row = rows.get(move.moveNumber) ?? {
      moveNumber: move.moveNumber,
      white: "",
      black: ""
    };

    if (move.color === "white") {
      row.white = move.notation;
    } else {
      row.black = move.notation;
    }

    rows.set(move.moveNumber, row);
  }

  return [...rows.values()];
}

function findCapturedPiece(state: BoardState, from: Square, to: Square): Piece | null {
  const movingPiece = state.squares[from];
  const targetPiece = state.squares[to];

  if (!movingPiece) {
    return null;
  }

  if (targetPiece) {
    return targetPiece;
  }

  if (movingPiece.type === "pawn" && state.enPassant === to && from[0] !== to[0]) {
    return state.squares[`${to[0]}${from[1]}` as Square];
  }

  return null;
}

function formatMove(piece: Piece, from: Square, to: Square, isCapture: boolean): string {
  const prefix = piece.type === "pawn" && isCapture ? from[0] : pieceNotation[piece.type];
  const capture = isCapture ? "x" : "-";

  return `${prefix}${from}${capture}${to}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
