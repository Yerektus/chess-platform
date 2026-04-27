import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Game, GameSchema } from "../games/schemas/game.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { LeaderboardController } from "./leaderboard.controller";
import { LeaderboardService } from "./leaderboard.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Game.name, schema: GameSchema }
    ])
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService]
})
export class LeaderboardModule {}
