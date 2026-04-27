import { Controller, Get, Query } from "@nestjs/common";
import { LeaderboardEntryDto } from "./dto/leaderboard-entry.dto";
import { LeaderboardService } from "./leaderboard.service";

@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Query("city") city?: string): Promise<LeaderboardEntryDto[]> {
    return this.leaderboardService.getTopUsers(city);
  }
}
