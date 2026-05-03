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
      <LandingFooter />
    </main>
  );
}

function LandingFooter() {
  const contacts = [
    {
      href: "https://t.me/boyapcky",
      label: "Telegram",
      value: "@boyapcky"
    },
    {
      href: "https://www.instagram.com/just.yerdos/",
      label: "Instagram",
      value: "just.yerdos"
    },
    {
      href: "mailto:qop6261@gmail.com",
      label: "Email",
      value: "qop6261@gmail.com"
    },
    {
      href: "tel:+77476062523",
      label: "Phone",
      value: "+77476062523"
    }
  ];

  return (
    <footer className="border-t border-white/10 bg-[#1f1e1b] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[15px] font-extrabold">Chess Platform</p>
          <p className="mt-1 text-[13px] leading-5 text-[#bdb8ad]">Контакты для связи</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map((contact) => (
            <a
              className="group min-w-[180px] rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-[#81b64c] hover:bg-white/[0.08]"
              href={contact.href}
              key={contact.label}
              rel={contact.href.startsWith("http") ? "noreferrer" : undefined}
              target={contact.href.startsWith("http") ? "_blank" : undefined}
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8f897e]">
                {contact.label}
              </span>
              <span className="mt-1 block text-[14px] font-semibold text-[#d5d1c8] group-hover:text-white">
                {contact.value}
              </span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function webUrl(path: string): string {
  return new URL(path, webBaseUrl).toString();
}
