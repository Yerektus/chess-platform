import { Type } from "class-transformer";
import { IsArray, IsIn, IsMongoId, IsOptional, IsString, ValidateNested } from "class-validator";
import { AnalysisEntryDto } from "./analysis-entry.dto";
import { type Color } from "@chess-platform/chess-engine";
import { type GameOpponent, type GameResult } from "../schemas/game.schema";

export class CreateGameDto {
  @IsOptional()
  @IsMongoId()
  blackId?: string | null;

  @IsIn(["human", "ai"])
  opponent!: GameOpponent;

  @IsString()
  pgn!: string;

  @IsOptional()
  @IsIn(["white", "black", "draw", null])
  result?: GameResult;

  @IsOptional()
  @IsIn(["white", "black"])
  ratedPlayerColor?: Color;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisEntryDto)
  analysis?: AnalysisEntryDto[];
}
