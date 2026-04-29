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
  classic: "wikipedia",
  neon: "spatial",
  pixel: "pixel",
  premium: "maestro"
};

const lichessPieceAssetBaseUrl = "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece";
const wikipediaPieceAssetBaseUrl = "https://chessboardjs.com/img/chesspieces/wikipedia";

export function getChessPieceImageUrl(piece: Piece, styleName: ChessPieceStyle = "classic"): string {
  const colorCode = piece.color === "white" ? "w" : "b";
  const pieceName = `${colorCode}${pieceCode[piece.type]}`;

  if (styleName === "classic") {
    return `${wikipediaPieceAssetBaseUrl}/${pieceName}.png`;
  }

  return `${lichessPieceAssetBaseUrl}/${pieceSetByStyle[styleName]}/${pieceName}.svg`;
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
