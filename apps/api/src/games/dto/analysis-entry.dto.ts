import { IsBoolean, IsInt, IsString, Min } from "class-validator";

export class AnalysisEntryDto {
  @IsInt()
  @Min(1)
  move!: number;

  @IsBoolean()
  mistake!: boolean;

  @IsString()
  suggestion!: string;
}
