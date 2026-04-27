import { GameResponseDto } from "./game-response.dto";

export class GameHistoryResponseDto {
  items!: GameResponseDto[];
  page!: number;
  limit!: number;
  total!: number;
}
