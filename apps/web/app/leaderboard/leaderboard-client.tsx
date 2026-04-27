"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { type LeaderboardEntry } from "@/lib/auth-types";
import { Input } from "@chess-platform/ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function LeaderboardClient({
  city,
  entries,
  error
}: {
  city: string;
  entries: LeaderboardEntry[];
  error: string | null;
}) {
  const { user } = useAuth();
  const [cityFilter, setCityFilter] = useState(city);
  const pathname = usePathname();
  const router = useRouter();
  const hasMounted = useRef(false);

  useEffect(() => {
    setCityFilter(city);
  }, [city]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      const normalizedCity = cityFilter.trim();

      if (normalizedCity) {
        params.set("city", normalizedCity);
      }

      router.replace(params.size ? `${pathname}?${params.toString()}` : pathname);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [cityFilter, pathname, router]);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[32px] font-medium leading-[1.2]">Leaderboard</h1>
            <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
              Top players ranked by current ELO.
            </p>
          </div>

          <label className="flex w-full max-w-[320px] flex-col gap-2 text-[13px] text-[var(--color-text-secondary)]">
            City
            <Input
              aria-label="City"
              onChange={(event) => setCityFilter(event.target.value)}
              placeholder="Filter by city"
              value={cityFilter}
            />
          </label>
        </header>

        <section className="overflow-hidden rounded-[8px] border border-[var(--color-border)]">
          {error ? <p className="px-3 py-4 text-[13px] text-[var(--color-text-secondary)]">{error}</p> : null}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[15px]">
              <thead className="bg-[var(--color-surface)] text-[13px] text-[var(--color-text-secondary)]">
                <tr>
                  <th className="w-[96px] px-3 py-3 text-left font-normal">Rank</th>
                  <th className="px-3 py-3 text-left font-normal">Player</th>
                  <th className="w-[120px] px-3 py-3 text-left font-normal">ELO</th>
                  <th className="px-3 py-3 text-left font-normal">City</th>
                  <th className="w-[120px] px-3 py-3 text-left font-normal">Games</th>
                </tr>
              </thead>
              <tbody>
                {entries.length ? (
                  entries.map((entry, index) => {
                    const isCurrentUser = entry.username === user?.username;
                    const rowClassName = isCurrentUser
                      ? "bg-[var(--color-surface)] font-medium"
                      : index % 2 === 0
                        ? "bg-[var(--color-bg)]"
                        : "bg-[var(--color-surface)]";

                    return (
                      <tr className={rowClassName} key={`${entry.rank}-${entry.username}`}>
                        <td className="px-3 py-3 font-mono text-[13px]">{entry.rank}</td>
                        <td className="px-3 py-3">{entry.username}</td>
                        <td className="px-3 py-3 font-mono text-[13px]">{entry.elo}</td>
                        <td className="px-3 py-3">{entry.city ?? "Unspecified"}</td>
                        <td className="px-3 py-3 font-mono text-[13px]">{entry.gamesPlayed}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="bg-[var(--color-bg)] px-3 py-6 text-[var(--color-text-secondary)]" colSpan={5}>
                      No players
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
