"use client";

import { Button, ThemeToggle } from "@chess-platform/ui";
import Link from "next/link";
import { useState } from "react";

export function SiteNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-4 md:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link className="min-h-11 py-3 text-[15px] font-medium text-[var(--color-text-primary)]" href="/game/local">
            Chess Platform
          </Link>
          <Button className="min-h-11 md:hidden" onClick={() => setMenuOpen((open) => !open)} variant="ghost">
            {menuOpen ? "Close" : "Menu"}
          </Button>
        </div>

        <nav
          className={
            menuOpen
              ? "flex flex-col gap-2 text-[13px] text-[var(--color-text-secondary)] md:flex md:flex-row md:items-center md:gap-5"
              : "hidden text-[13px] text-[var(--color-text-secondary)] md:flex md:items-center md:gap-5"
          }
        >
          <Link className="min-h-11 py-3 hover:text-[var(--color-text-primary)] md:min-h-0 md:py-0" href="/game/local">
            Play
          </Link>
          <Link className="min-h-11 py-3 hover:text-[var(--color-text-primary)] md:min-h-0 md:py-0" href="/leaderboard">
            Leaderboard
          </Link>
          <Link className="min-h-11 py-3 hover:text-[var(--color-text-primary)] md:min-h-0 md:py-0" href="/profile">
            Profile
          </Link>
          <ThemeToggle className="mt-2 min-h-11 self-start md:mt-0" />
        </nav>
      </div>
    </header>
  );
}
