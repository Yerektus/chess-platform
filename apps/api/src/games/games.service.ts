import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateGameDto } from "./dto/create-game.dto";
import { Game, type GameDocument } from "./schemas/game.schema";
import { StockfishAnalysisService } from "./stockfish-analysis.service";

@Injectable()
export class GamesService {
  private readonly activeAnalysisJobs = new Set<string>();

  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    private readonly stockfishAnalysisService: StockfishAnalysisService
  ) {}

  async create(dto: CreateGameDto & { whiteId: string }): Promise<GameDocument> {
    return this.gameModel.create({
      ...dto,
      whiteId: new Types.ObjectId(dto.whiteId),
      blackId: dto.blackId ? new Types.ObjectId(dto.blackId) : null,
      analysis: dto.analysis ?? [],
      result: dto.result ?? null
    });
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

  private async runAnalysis(id: string, pgn: string): Promise<void> {
    try {
      const analysis = await this.stockfishAnalysisService.analyzePgn(pgn);

      await this.gameModel.findByIdAndUpdate(id, { analysis }, { runValidators: true }).exec();
    } finally {
      this.activeAnalysisJobs.delete(id);
    }
  }
}

function userOwnsGame(game: GameDocument, userId: string): boolean {
  return game.whiteId.toString() === userId || game.blackId?.toString() === userId;
}
