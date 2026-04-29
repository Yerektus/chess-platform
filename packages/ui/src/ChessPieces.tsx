"use client";

import { type Piece } from "@chess-platform/chess-engine";

export type ChessPieceStyle = "classic" | "neon" | "pixel" | "premium";

type ChessPieceSvgProps = {
  piece: Piece;
  styleName?: ChessPieceStyle;
};

const pieceLabel: Record<Piece["type"], string> = {
  king: "King",
  queen: "Queen",
  rook: "Rook",
  bishop: "Bishop",
  knight: "Knight",
  pawn: "Pawn"
};

const pieceCode: Record<Piece["type"], string> = {
  king: "K",
  queen: "Q",
  rook: "R",
  bishop: "B",
  knight: "N",
  pawn: "P"
};

const pieceSetByStyle: Record<ChessPieceStyle, string> = {
  classic: "cburnett",
  neon: "spatial",
  pixel: "pixel",
  premium: "maestro"
};

const pieceAssetBaseUrl = "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece";

export function getChessPieceImageUrl(piece: Piece, styleName: ChessPieceStyle = "classic"): string {
  return `${pieceAssetBaseUrl}/${pieceSetByStyle[styleName]}/${piece.color[0]}${pieceCode[piece.type]}.svg`;
}

export function ChessPieceSvg({ piece, styleName = "classic" }: ChessPieceSvgProps) {
  return (
    <img
      alt={`${piece.color} ${pieceLabel[piece.type]}`}
      className="relative z-10 h-[86%] w-[86%] select-none object-contain drop-shadow-sm"
      draggable={false}
      src={getChessPieceImageUrl(piece, styleName)}
    />
  );
}
