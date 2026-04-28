import { ChessHomeClient } from "./chess-home-client";
import { LandingNavigation } from "./landing-navigation";

const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <LandingNavigation loginHref={webUrl("/login")} signUpHref={webUrl("/register")} />
      <ChessHomeClient
        aiGameHref={webUrl("/game/ai")}
        localGameHref={webUrl("/game/local")}
        onlineGameHref={webUrl("/game/online/new")}
        profileHref={webUrl("/profile?upgrade=premium")}
      />
    </main>
  );
}

function webUrl(path: string): string {
  return new URL(path, webBaseUrl).toString();
}
