import { type Piece } from "@chess-platform/chess-engine";

type ChessPieceSvgProps = {
  piece: Piece;
};

const pieceLabel: Record<Piece["type"], string> = {
  king: "King",
  queen: "Queen",
  rook: "Rook",
  bishop: "Bishop",
  knight: "Knight",
  pawn: "Pawn"
};

export function ChessPieceSvg({ piece }: ChessPieceSvgProps) {
  const foreground = piece.color === "white" ? "var(--color-surface)" : "var(--color-text-primary)";
  const stroke = piece.color === "white" ? "var(--color-text-primary)" : "var(--color-bg)";

  return (
    <svg
      aria-label={`${piece.color} ${pieceLabel[piece.type]}`}
      className="relative z-10 h-[82%] w-[82%] drop-shadow-sm"
      role="img"
      viewBox="0 0 64 64"
    >
      <g fill={foreground} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8">
        {piece.type === "king" ? <KingShape /> : null}
        {piece.type === "queen" ? <QueenShape /> : null}
        {piece.type === "rook" ? <RookShape /> : null}
        {piece.type === "bishop" ? <BishopShape /> : null}
        {piece.type === "knight" ? <KnightShape /> : null}
        {piece.type === "pawn" ? <PawnShape /> : null}
      </g>
    </svg>
  );
}

function KingShape() {
  return (
    <>
      <path d="M32 8v14" />
      <path d="M25 15h14" />
      <path d="M24 57h16" />
      <path d="M20 49h24l-4 8H24z" />
      <path d="M23 42h18l3 7H20z" />
      <path d="M24 42c-4-7-4-15 1-20 4-4 10-4 14 0 5 5 5 13 1 20z" />
    </>
  );
}

function QueenShape() {
  return (
    <>
      <circle cx="16" cy="18" r="3" />
      <circle cx="26" cy="13" r="3" />
      <circle cx="38" cy="13" r="3" />
      <circle cx="48" cy="18" r="3" />
      <path d="M17 23l7 19h16l7-19-11 10-4-15-4 15z" />
      <path d="M22 49h20l-3 8H25z" />
      <path d="M21 42h22" />
    </>
  );
}

function RookShape() {
  return (
    <>
      <path d="M18 13h8v7h12v-7h8v15H18z" />
      <path d="M22 28h20v17H22z" />
      <path d="M18 45h28l-4 12H22z" />
      <path d="M20 57h24" />
    </>
  );
}

function BishopShape() {
  return (
    <>
      <circle cx="32" cy="15" r="5" />
      <path d="M26 43c-5-11-1-22 6-27 7 5 11 16 6 27z" />
      <path d="M35 22l-7 10" />
      <path d="M22 49h20l-3 8H25z" />
      <path d="M20 43h24l-2 6H22z" />
    </>
  );
}

function KnightShape() {
  return (
    <>
      <path d="M21 57h27l-5-12H24z" />
      <path d="M25 45c-1-10 2-17 10-22l-3-10c8 2 14 9 16 18 1 6-2 10-8 10h-7" />
      <path d="M35 23l-10 6" />
      <path d="M39 30h.1" />
    </>
  );
}

function PawnShape() {
  return (
    <>
      <circle cx="32" cy="20" r="8" />
      <path d="M25 42c1-8 3-14 7-14s6 6 7 14z" />
      <path d="M21 49h22l-4 8H25z" />
      <path d="M20 42h24l-1 7H21z" />
    </>
  );
}
