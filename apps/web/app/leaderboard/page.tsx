import { apiBaseUrl } from "@/lib/api";
import { type LeaderboardEntry } from "@/lib/auth-types";
import { LeaderboardClient } from "./leaderboard-client";

export const revalidate = 60;

export default async function LeaderboardPage({ searchParams }: { searchParams: { city?: string } }) {
  const city = normalizeCity(searchParams.city);
  const { entries, error } = await getLeaderboard(city);

  return <LeaderboardClient city={city ?? ""} entries={entries} error={error} />;
}

async function getLeaderboard(city?: string): Promise<{ entries: LeaderboardEntry[]; error: string | null }> {
  const url = new URL("/leaderboard", apiBaseUrl);

  if (city) {
    url.searchParams.set("city", city);
  }

  try {
    const response = await fetch(url, {
      next: {
        revalidate: 60
      }
    });

    if (!response.ok) {
      return {
        entries: [],
        error: "Unable to load leaderboard"
      };
    }

    return {
      entries: (await response.json()) as LeaderboardEntry[],
      error: null
    };
  } catch {
    return {
      entries: [],
      error: "Unable to load leaderboard"
    };
  }
}

function normalizeCity(city?: string): string | undefined {
  const trimmedCity = city?.trim();

  return trimmedCity ? trimmedCity : undefined;
}
