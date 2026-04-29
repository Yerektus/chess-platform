import { type Color } from "@chess-platform/chess-engine";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { calculateEloAgainstOpponent, calculateEloPair, getScoreForColor } from "../users/elo";
import { User, type UserDocument } from "../users/schemas/user.schema";
import { type AnalyzeGameResponseDto } from "./dto/analyze-game-response.dto";
import { CreateGameDto } from "./dto/create-game.dto";
import { Game, type GameDocument, type GameResult } from "./schemas/game.schema";
import { StockfishAnalysisService } from "./stockfish-analysis.service";

@Injectable()
export class GamesService {
  private readonly activeAnalysisJobs = new Set<string>();

  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly stockfishAnalysisService: StockfishAnalysisService
  ) {}

  async create(dto: CreateGameDto & { whiteId: string }): Promise<GameDocument> {
    const game = await this.gameModel.create({
      whiteId: new Types.ObjectId(dto.whiteId),
      blackId: dto.blackId ? new Types.ObjectId(dto.blackId) : null,
      opponent: dto.opponent,
      pgn: dto.pgn,
      analysis: dto.analysis ?? [],
      result: dto.result ?? null
    });

    await this.updateRatings(dto);

    return game;
  }

  async findById(id: string): Promise<GameDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.gameModel.findById(id).exec();
  }

  async findHistoryByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ items: GameDocument[]; total: number; page: number; limit: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      return { items: [], total: 0, page, limit };
    }

    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(100, Math.max(1, limit));
    const userObjectId = new Types.ObjectId(userId);
    const query = {
      $or: [{ whiteId: userObjectId }, { blackId: userObjectId }]
    };
    const [items, total] = await Promise.all([
      this.gameModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((normalizedPage - 1) * normalizedLimit)
        .limit(normalizedLimit)
        .exec(),
      this.gameModel.countDocuments(query).exec()
    ]);

    return {
      items,
      total,
      page: normalizedPage,
      limit: normalizedLimit
    };
  }

  async startAnalysis(id: string, userId: string): Promise<void> {
    const game = await this.findById(id);

    if (!game) {
      throw new NotFoundException("Game not found");
    }

    if (!userOwnsGame(game, userId)) {
      throw new ForbiddenException("User does not own this game");
    }

    if (this.activeAnalysisJobs.has(game._id.toString())) {
      return;
    }

    this.activeAnalysisJobs.add(game._id.toString());
    void this.runAnalysis(game._id.toString(), game.pgn).catch(() => undefined);
  }

  async analyzePgn(pgn: string, depth?: number): Promise<AnalyzeGameResponseDto> {
    return this.stockfishAnalysisService.analyzePgnDetailed(pgn, depth);
  }

  private async runAnalysis(id: string, pgn: string): Promise<void> {
    try {
      const analysis = await this.stockfishAnalysisService.analyzePgn(pgn);

      await this.gameModel.findByIdAndUpdate(id, { analysis }, { runValidators: true }).exec();
    } finally {
      this.activeAnalysisJobs.delete(id);
    }
  }

  private async updateRatings(dto: CreateGameDto & { whiteId: string }): Promise<void> {
    if (!dto.result) {
      return;
    }

    if (dto.blackId) {
      await this.updateHumanRatings(dto.whiteId, dto.blackId, dto.result);
      return;
    }

    if (dto.opponent === "ai" && dto.ratedPlayerColor) {
      await this.updateAiGameRating(dto.whiteId, dto.ratedPlayerColor, dto.result);
    }
  }

  private async updateHumanRatings(whiteId: string, blackId: string, result: GameResult): Promise<void> {
    const [white, black] = await Promise.all([
      this.userModel.findById(whiteId).select({ elo: 1 }).exec(),
      this.userModel.findById(blackId).select({ elo: 1 }).exec()
    ]);

    if (!white || !black) {
      return;
    }

    const nextRatings = calculateEloPair(white.elo, black.elo, result);

    await Promise.all([
      this.userModel.findByIdAndUpdate(white._id, { elo: nextRatings.whiteElo }, { runValidators: true }).exec(),
      this.userModel.findByIdAndUpdate(black._id, { elo: nextRatings.blackElo }, { runValidators: true }).exec()
    ]);
  }

  private async updateAiGameRating(userId: string, playerColor: Color, result: GameResult): Promise<void> {
    const user = await this.userModel.findById(userId).select({ elo: 1 }).exec();

    if (!user) {
      return;
    }

    const aiElo = 1200;
    const score = getScoreForColor(result, playerColor);
    const nextElo = calculateEloAgainstOpponent(user.elo, aiElo, score);

    await this.userModel.findByIdAndUpdate(user._id, { elo: nextElo }, { runValidators: true }).exec();
  }
}

function userOwnsGame(game: GameDocument, userId: string): boolean {
  return game.whiteId.toString() === userId || game.blackId?.toString() === userId;
}
