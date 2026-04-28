"use client";

import { Button, ThemeToggle } from "@chess-platform/ui";
import Link from "next/link";
import { useState } from "react";

export function LandingNavigation({ loginHref }: { loginHref: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-5 md:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="min-h-11 py-3 text-[15px] font-medium">
            Chess Platform
          </Link>
          <Button className="min-h-11 md:hidden" onClick={() => setMenuOpen((open) => !open)} variant="ghost">
            {menuOpen ? "Close" : "Menu"}
          </Button>
        </div>

        <nav
          className={
            menuOpen
              ? "flex flex-col gap-2 text-[13px] text-[var(--color-text-secondary)] md:flex md:flex-row md:items-center md:justify-end md:gap-5"
              : "hidden text-[13px] text-[var(--color-text-secondary)] md:flex md:items-center md:justify-end md:gap-5"
          }
        >
          <Link href="#features" className="min-h-11 py-3 hover:text-[var(--color-text-primary)] md:min-h-0 md:py-0">
            Features
          </Link>
          <Link href="#pricing" className="min-h-11 py-3 hover:text-[var(--color-text-primary)] md:min-h-0 md:py-0">
            Pricing
          </Link>
          <Link href={loginHref} className="min-h-11 py-3 hover:text-[var(--color-text-primary)] md:min-h-0 md:py-0">
            Log in
          </Link>
          <ThemeToggle className="mt-2 min-h-11 self-start md:mt-0" />
        </nav>
      </div>
    </header>
  );
}
