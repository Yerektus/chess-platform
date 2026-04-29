import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../users/schemas/user.schema";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { Game, GameSchema } from "./schemas/game.schema";
import { StockfishAnalysisService } from "./stockfish-analysis.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }, { name: User.name, schema: UserSchema }])],
  controllers: [GamesController],
  providers: [GamesService, StockfishAnalysisService],
  exports: [GamesService]
})
export class GamesModule {}
