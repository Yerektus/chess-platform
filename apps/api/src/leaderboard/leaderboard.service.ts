import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Game, type GameDocument } from "../games/schemas/game.schema";
import { User, type UserDocument } from "../users/schemas/user.schema";
import { LeaderboardEntryDto } from "./dto/leaderboard-entry.dto";

@Injectable()
export class LeaderboardService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 5 * 60 * 1000;
  private readonly limit = 100;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>
  ) {}

  async getTopUsers(city?: string): Promise<LeaderboardEntryDto[]> {
    const normalizedCity = normalizeCity(city);
    const cacheKey = normalizedCity ? `city:${normalizedCity}` : "global";
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const users = await this.userModel
      .find(normalizedCity ? { city: normalizedCity } : {})
      .select({ _id: 1, username: 1, elo: 1, city: 1 })
      .sort({ elo: -1, username: 1 })
      .limit(this.limit)
      .lean<LeaderboardUser[]>()
      .exec();

    const gamesPlayedByUserId = await this.getGamesPlayedByUserId(users.map((user) => user._id));
    const data = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      elo: user.elo,
      city: user.city ?? null,
      gamesPlayed: gamesPlayedByUserId.get(user._id.toString()) ?? 0
    }));

    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + this.cacheTtlMs
    });

    return data;
  }

  private async getGamesPlayedByUserId(userIds: Types.ObjectId[]): Promise<Map<string, number>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const counts = await this.gameModel
      .aggregate<GameCountResult>([
        {
          $match: {
            $or: [{ whiteId: { $in: userIds } }, { blackId: { $in: userIds } }]
          }
        },
        {
          $project: {
            players: ["$whiteId", "$blackId"]
          }
        },
        { $unwind: "$players" },
        {
          $match: {
            players: { $in: userIds }
          }
        },
        {
          $group: {
            _id: "$players",
            gamesPlayed: { $sum: 1 }
          }
        }
      ])
      .exec();

    return new Map(counts.map((count) => [count._id.toString(), count.gamesPlayed]));
  }
}

type CacheEntry = {
  data: LeaderboardEntryDto[];
  expiresAt: number;
};

type LeaderboardUser = {
  _id: Types.ObjectId;
  username: string;
  elo: number;
  city?: string;
};

type GameCountResult = {
  _id: Types.ObjectId;
  gamesPlayed: number;
};

function normalizeCity(city?: string): string | undefined {
  const trimmedCity = city?.trim();

  return trimmedCity ? trimmedCity : undefined;
}
