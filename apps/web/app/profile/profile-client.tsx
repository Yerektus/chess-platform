"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { type GameHistoryResponse } from "@/lib/auth-types";
import { Button, Card } from "@chess-platform/ui";
import { useEffect, useState } from "react";

export function ProfileClient({ page }: { page: number }) {
  const { accessToken, user, isLoading, logout } = useAuth();
  const [history, setHistory] = useState<GameHistoryResponse | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;

    async function loadHistory() {
      setHistoryError(null);

      try {
        const response = await fetch(`/api/games/history?page=${page}&limit=10`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error("Unable to load game history");
        }

        const payload = (await response.json()) as GameHistoryResponse;

        if (active) {
          setHistory(payload);
        }
      } catch (caughtError) {
        if (active) {
          setHistoryError(caughtError instanceof Error ? caughtError.message : "Unable to load game history");
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [accessToken, page]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
        <div className="mx-auto max-w-[1200px] text-[15px] text-[var(--color-text-secondary)]">Loading profile</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-medium leading-[1.2]">Profile</h1>
            <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">Account and game history.</p>
          </div>
          <Button onClick={logout} variant="ghost">
            Log out
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <ProfileStat label="Username" value={user?.username ?? "Unavailable"} />
          <ProfileStat label="ELO" value={String(user?.elo ?? "Unavailable")} />
          <ProfileStat label="Plan" value={user?.plan ?? "Unavailable"} />
        </section>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-medium leading-[1.2]">Game history</h2>
              <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                {history ? `${history.total} games` : "Loading games"}
              </p>
            </div>
          </div>

          {historyError ? <p className="text-[13px] text-[var(--color-text-secondary)]">{historyError}</p> : null}

          <div className="overflow-x-auto rounded-[6px] border border-[var(--color-border)]">
            <table className="w-full border-collapse text-[15px]">
              <thead className="bg-[var(--color-surface)] text-[13px] text-[var(--color-text-secondary)]">
                <tr>
                  <th className="px-3 py-3 text-left font-normal">Created</th>
                  <th className="px-3 py-3 text-left font-normal">Opponent</th>
                  <th className="px-3 py-3 text-left font-normal">Result</th>
                  <th className="px-3 py-3 text-left font-normal">PGN</th>
                </tr>
              </thead>
              <tbody>
                {history?.items.length ? (
                  history.items.map((game, index) => (
                    <tr
                      className={index % 2 === 0 ? "bg-[var(--color-bg)]" : "bg-[var(--color-surface)]"}
                      key={game.id}
                    >
                      <td className="px-3 py-3">{new Date(game.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3">{game.opponent}</td>
                      <td className="px-3 py-3">{game.result ?? "In progress"}</td>
                      <td className="max-w-[360px] truncate px-3 py-3 font-mono text-[13px]">{game.pgn}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-[var(--color-text-secondary)]" colSpan={4}>
                      No games
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-[13px] text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-[24px] font-medium leading-[1.2]">{value}</p>
    </Card>
  );
}
