import { IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";
import { type UserPlan } from "../schemas/user.schema";

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  passwordHash!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  elo?: number;

  @IsOptional()
  @IsIn(["free", "pro"])
  plan?: UserPlan;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
}
