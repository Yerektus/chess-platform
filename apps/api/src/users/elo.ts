import { type Color } from "@chess-platform/chess-engine";

type GameResult = Color | "draw" | null;

const kFactor = 32;

export function calculateEloAgainstOpponent(playerElo: number, opponentElo: number, score: number): number {
  const expectedScore = 1 / (1 + 10 ** ((opponentElo - playerElo) / 400));
  const nextElo = Math.round(playerElo + kFactor * (score - expectedScore));

  return Math.max(0, nextElo);
}

export function calculateEloPair(
  whiteElo: number,
  blackElo: number,
  result: GameResult
): { blackElo: number; whiteElo: number } {
  const whiteScore = getScoreForColor(result, "white");

  return {
    whiteElo: calculateEloAgainstOpponent(whiteElo, blackElo, whiteScore),
    blackElo: calculateEloAgainstOpponent(blackElo, whiteElo, 1 - whiteScore)
  };
}

export function getScoreForColor(result: GameResult, color: Color): number {
  if (result === "draw") {
    return 0.5;
  }

  return result === color ? 1 : 0;
}
