import { type GameOpponent, type GameResult } from "../schemas/game.schema";

export class GameResponseDto {
  id!: string;
  whiteId!: string;
  blackId!: string | null;
  opponent!: GameOpponent;
  pgn!: string;
  result!: GameResult;
  analysis!: Array<{
    move: number;
    mistake: boolean;
    suggestion: string;
  }>;
  createdAt!: string;
}
