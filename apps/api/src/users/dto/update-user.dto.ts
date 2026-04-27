import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
}
