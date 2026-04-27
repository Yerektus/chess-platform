import { type UserPlan } from "../schemas/user.schema";

export class UserResponseDto {
  id!: string;
  username!: string;
  email!: string;
  elo!: number;
  plan!: UserPlan;
  city?: string;
  createdAt!: string;
}
