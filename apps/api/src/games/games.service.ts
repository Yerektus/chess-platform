import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateGameDto } from "./dto/create-game.dto";
import { Game, type GameDocument } from "./schemas/game.schema";

@Injectable()
export class GamesService {
  constructor(@InjectModel(Game.name) private readonly gameModel: Model<GameDocument>) {}

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
}
