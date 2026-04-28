import { IsBoolean, IsHexColor, IsIn, IsOptional } from "class-validator";

export class UpdateUserPreferencesDto {
  @IsIn(["green", "blue", "wood", "marble"])
  @IsOptional()
  boardTheme?: string;

  @IsIn(["classic", "neon", "pixel", "premium"])
  @IsOptional()
  pieceStyle?: string;

  @IsHexColor()
  @IsOptional()
  highlightColor?: string;

  @IsBoolean()
  @IsOptional()
  animations?: boolean;

  @IsBoolean()
  @IsOptional()
  sounds?: boolean;
}
