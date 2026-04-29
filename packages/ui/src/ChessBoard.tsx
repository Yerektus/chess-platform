"use client";

import { type BoardState, type Square } from "@chess-platform/chess-engine";
import { ChessPieceSvg, type ChessPieceStyle } from "./ChessPieces";
import { cx } from "./utils";

export type ChessBoardProps = {
  state: BoardState;
  orientation: "white" | "black";
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  onSquareClick: (square: Square) => void;
  className?: string;
  pieceStyle?: ChessPieceStyle;
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const whiteFiles = files;
const blackFiles = [...files].reverse();
const whiteRanks = [...ranks].reverse();
const blackRanks = ranks;

export function ChessBoard({
  state,
  orientation,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
  className,
  pieceStyle = "classic"
}: ChessBoardProps) {
  const displayFiles = orientation === "white" ? whiteFiles : blackFiles;
  const displayRanks = orientation === "white" ? whiteRanks : blackRanks;
  const legalMoveSet = new Set(legalMoves);

  return (
    <div
      className={cx(
        "grid aspect-square w-full max-w-[560px] overflow-hidden rounded-[8px] border border-[var(--color-border)]",
        className
      )}
      style={{
        gridTemplateColumns: "repeat(8, calc(100% / 8))",
        gridTemplateRows: "repeat(8, calc(100% / 8))"
      }}
    >
      {displayRanks.map((rank, rowIndex) =>
        displayFiles.map((file, columnIndex) => {
          const square = `${file}${rank}` as Square;
          const piece = state.squares[square];
          const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 1;
          const isSelected = selectedSquare === square;
          const isLastMove = lastMove?.from === square || lastMove?.to === square;
          const isLegalMove = legalMoveSet.has(square);
          const showFileLabel = rowIndex === 7;
          const showRankLabel = columnIndex === 0;

          return (
            <button
              aria-label={piece ? `${square}, ${piece.color} ${piece.type}` : square}
              className={cx(
                "relative flex h-full w-full items-center justify-center overflow-hidden text-[var(--color-text-primary)]",
                isLight ? "bg-[var(--color-square-light)]" : "bg-[var(--color-square-dark)]"
              )}
              key={square}
              onClick={() => onSquareClick(square)}
              type="button"
            >
              {isSelected || isLastMove ? (
                <span className="pointer-events-none absolute inset-0 z-0 bg-[var(--color-highlight)]" />
              ) : null}
              {isLegalMove ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-highlight)]" />
              ) : null}
              {showRankLabel ? (
                <span className="pointer-events-none absolute left-1 top-1 z-20 font-mono text-[13px] leading-none text-[var(--color-text-secondary)]">
                  {rank}
                </span>
              ) : null}
              {showFileLabel ? (
                <span className="pointer-events-none absolute bottom-1 right-1 z-20 font-mono text-[13px] leading-none text-[var(--color-text-secondary)]">
                  {file}
                </span>
              ) : null}
              {piece ? <ChessPieceSvg piece={piece} styleName={pieceStyle} /> : null}
            </button>
          );
        })
      )}
    </div>
  );
}
