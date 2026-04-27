export class LeaderboardEntryDto {
  rank!: number;
  username!: string;
  elo!: number;
  city!: string | null;
  gamesPlayed!: number;
}
