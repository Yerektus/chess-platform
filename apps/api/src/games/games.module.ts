import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { Game, GameSchema } from "./schemas/game.schema";
import { StockfishAnalysisService } from "./stockfish-analysis.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }])],
  controllers: [GamesController],
  providers: [GamesService, StockfishAnalysisService],
  exports: [GamesService]
})
export class GamesModule {}
