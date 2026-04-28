import { type Color } from "@chess-platform/chess-engine";

export type MoveClassification = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export class AnalyzeGameMoveDto {
  moveNumber!: number;
  color!: Color;
  san!: string;
  eval!: number;
  classification!: MoveClassification;
  bestMove!: string;
  comment?: string;
}

export class AnalyzeGameResponseDto {
  accuracy!: {
    white: number;
    black: number;
  };

  moves!: AnalyzeGameMoveDto[];

  summary!: {
    blunders: Record<Color, number>;
    mistakes: Record<Color, number>;
    inaccuracies: Record<Color, number>;
  };
}
