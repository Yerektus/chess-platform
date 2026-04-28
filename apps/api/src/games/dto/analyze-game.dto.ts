import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class AnalyzeGameDto {
  @IsString()
  pgn!: string;

  @IsInt()
  @IsOptional()
  @Max(24)
  @Min(1)
  depth?: number;
}
