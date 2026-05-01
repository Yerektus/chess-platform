"use client";

import { ThemeToggle } from "@chess-platform/ui";
import Link from "next/link";

export function SiteNavigation() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 overflow-x-auto px-6 md:px-12">
        <Link className="shrink-0 text-[15px] font-bold text-[var(--color-text-primary)]" href="/game/local">
          Chess Platform
        </Link>

        <nav className="flex min-w-max flex-1 items-center gap-7 text-[13px] font-medium text-[var(--color-text-secondary)]">
          <Link className="py-5 transition-colors hover:text-[var(--color-text-primary)]" href="/game/local">
            Играть
          </Link>
          <Link className="py-5 transition-colors hover:text-[var(--color-text-primary)]" href="/leaderboard">
            Рейтинг
          </Link>
          <Link className="py-5 transition-colors hover:text-[var(--color-text-primary)]" href="/profile">
            Профиль
          </Link>
          <Link className="py-5 transition-colors hover:text-[var(--color-text-primary)]" href="/customization">
            Кастомизация
          </Link>
          <ThemeToggle className="ml-auto shrink-0" />
        </nav>
      </div>
    </header>
  );
}
