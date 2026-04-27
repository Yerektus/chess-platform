import { IsIn, IsOptional, IsString, Matches } from "class-validator";

export class JoinRoomDto {
  @IsString()
  @Matches(/^[A-Z0-9]{6}$/)
  code!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class MoveRoomDto {
  @IsString()
  @Matches(/^[A-Z0-9]{6}$/)
  code!: string;

  @IsString()
  @Matches(/^[a-h][1-8]$/)
  from!: string;

  @IsString()
  @Matches(/^[a-h][1-8]$/)
  to!: string;

  @IsOptional()
  @IsIn(["queen", "rook", "bishop", "knight"])
  promotion?: "queen" | "rook" | "bishop" | "knight";
}

export class ResignRoomDto {
  @IsString()
  @Matches(/^[A-Z0-9]{6}$/)
  code!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
