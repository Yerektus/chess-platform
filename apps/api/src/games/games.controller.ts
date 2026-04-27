import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateGameDto } from "./dto/create-game.dto";
import { GameHistoryResponseDto } from "./dto/game-history-response.dto";
import { GameResponseDto } from "./dto/game-response.dto";
import { type GameDocument } from "./schemas/game.schema";
import { GamesService } from "./games.service";

@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() request: AuthenticatedRequest, @Body() dto: CreateGameDto): Promise<GameResponseDto> {
    const game = await this.gamesService.create({
      ...dto,
      whiteId: getAuthenticatedUserId(request)
    });

    return toGameResponse(game);
  }

  @Get("history")
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Req() request: AuthenticatedRequest,
    @Query("page") page = "1",
    @Query("limit") limit = "20"
  ): Promise<GameHistoryResponseDto> {
    const history = await this.gamesService.findHistoryByUserId(
      getAuthenticatedUserId(request),
      Number(page),
      Number(limit)
    );

    return {
      items: history.items.map(toGameResponse),
      page: history.page,
      limit: history.limit,
      total: history.total
    };
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getById(@Param("id") id: string): Promise<GameResponseDto> {
    const game = await this.gamesService.findById(id);

    if (!game) {
      throw new NotFoundException("Game not found");
    }

    return toGameResponse(game);
  }

  @Post(":id/analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  async analyze(@Req() request: AuthenticatedRequest, @Param("id") id: string): Promise<{ status: "accepted" }> {
    await this.gamesService.startAnalysis(id, getAuthenticatedUserId(request));

    return { status: "accepted" };
  }
}

type AuthenticatedRequest = {
  user?: {
    sub?: string;
  };
};

function getAuthenticatedUserId(request: AuthenticatedRequest): string {
  const userId = request.user?.sub;

  if (!userId) {
    throw new NotFoundException("User not found");
  }

  return userId;
}

function toGameResponse(game: GameDocument): GameResponseDto {
  return {
    id: game._id.toString(),
    whiteId: game.whiteId.toString(),
    blackId: game.blackId?.toString() ?? null,
    opponent: game.opponent,
    pgn: game.pgn,
    result: game.result,
    analysis: game.analysis.map((entry) => ({
      move: entry.move,
      mistake: entry.mistake,
      suggestion: entry.suggestion
    })),
    createdAt: game.createdAt.toISOString()
  };
}
