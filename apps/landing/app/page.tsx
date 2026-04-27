import { Button, Card } from "@chess-platform/ui";
import Link from "next/link";

type LeaderboardEntry = {
  rank: number;
  username: string;
  elo: number;
  city?: string;
  gamesPlayed: number;
};

const apiBaseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export const revalidate = 60;

export default async function LandingPage() {
  const leaderboard = await getLeaderboardPreview();

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 md:px-12">
          <Link href="/" className="text-[15px] font-medium">
            Chess Platform
          </Link>
          <nav className="flex items-center gap-6 text-[13px] text-[var(--color-text-secondary)]">
            <Link href="#features" className="hover:text-[var(--color-text-primary)]">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-[var(--color-text-primary)]">
              Pricing
            </Link>
            <Link href={webUrl("/login")} className="hover:text-[var(--color-text-primary)]">
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-20 md:px-12 md:pb-20 md:pt-24">
        <div className="max-w-[760px]">
          <h1 className="text-5xl font-medium leading-[1.05] tracking-normal md:text-[64px]">
            Chess Platform
          </h1>
          <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-[var(--color-text-secondary)]">
            Play serious games, improve with AI analysis, and compete with players in your city.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={webUrl("/game/local")}>Play now</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={webUrl("/register")}>Sign up free</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-[var(--color-border)]">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-6 py-16 md:grid-cols-3 md:px-12">
          <Feature
            title="Play vs AI"
            body="Train against a Stockfish-powered opponent from the browser. Choose a focused session and keep the board at the center of the experience."
          />
          <Feature
            title="Multiplayer"
            body="Create a room and share a link for real-time games. Moves sync through WebSockets so both players stay on the same position."
          />
          <Feature
            title="AI Coach"
            body="Review completed games with engine-backed analysis. Mistakes are marked in the move list with a better continuation to study."
          />
        </div>
      </section>

      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 md:grid-cols-[1fr_440px] md:px-12">
          <div>
            <h2 className="text-2xl font-medium leading-[1.2]">Leaderboard preview</h2>
            <p className="mt-3 max-w-[520px] text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">
              The top players are ranked by ELO and refreshed every minute.
            </p>
          </div>
          <LeaderboardTable entries={leaderboard} />
        </div>
      </section>

      <section id="pricing" className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-12">
          <h2 className="text-2xl font-medium leading-[1.2]">Pricing</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <div className="flex min-h-[300px] flex-col">
                <h3 className="text-[18px] font-medium">Free</h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">
                  Local games, online rooms, leaderboard access, and basic game history.
                </p>
                <div className="mt-8 space-y-3 text-[15px]">
                  <p>Play local games</p>
                  <p>Join multiplayer rooms</p>
                  <p>View public leaderboard</p>
                </div>
                <div className="mt-auto pt-8">
                  <Button asChild variant="ghost">
                    <Link href={webUrl("/register")}>Sign up free</Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex min-h-[300px] flex-col">
                <h3 className="text-[18px] font-medium">Pro</h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">
                  Premium analysis workflows, Pro account status, and future customization features.
                </p>
                <div className="mt-8 space-y-3 text-[15px]">
                  <p>AI Coach review tools</p>
                  <p>Premium feature access</p>
                  <p>Pro subscription tier</p>
                </div>
                <div className="mt-auto pt-8">
                  <Button asChild>
                    <Link href={webUrl("/profile")}>Upgrade to Pro</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-8 text-[13px] text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between md:px-12">
          <nav className="flex flex-wrap gap-5">
            <Link href="#features" className="hover:text-[var(--color-text-primary)]">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-[var(--color-text-primary)]">
              Pricing
            </Link>
            <Link href={webUrl("/leaderboard")} className="hover:text-[var(--color-text-primary)]">
              Leaderboard
            </Link>
          </nav>
          <p>Copyright 2026 Chess Platform.</p>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-medium leading-[1.2]">{title}</h2>
      <p className="mt-3 text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">{body}</p>
    </div>
  );
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
          <tr>
            <th className="px-4 py-3 font-normal">Rank</th>
            <th className="px-4 py-3 font-normal">Player</th>
            <th className="px-4 py-3 text-right font-normal">ELO</th>
          </tr>
        </thead>
        <tbody>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <tr key={`${entry.rank}-${entry.username}`} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3 font-mono">{entry.rank}</td>
                <td className="px-4 py-3">{entry.username}</td>
                <td className="px-4 py-3 text-right font-mono">{entry.elo}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-text-secondary)]">
                Leaderboard is unavailable
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

async function getLeaderboardPreview(): Promise<LeaderboardEntry[]> {
  const url = new URL("/leaderboard", apiBaseUrl);

  try {
    const response = await fetch(url, {
      next: {
        revalidate: 60
      }
    });

    if (!response.ok) {
      return [];
    }

    const entries = (await response.json()) as LeaderboardEntry[];

    return entries.slice(0, 5);
  } catch {
    return [];
  }
}

function webUrl(path: string): string {
  return new URL(path, webBaseUrl).toString();
}
