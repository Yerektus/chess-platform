"use client";

import { Button, ThemeToggle } from "@chess-platform/ui";
import Link from "next/link";

export function LandingNavigation({ loginHref, signUpHref }: { loginHref: string; signUpHref: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#1f1e1b]/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 overflow-x-auto px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[16px] font-extrabold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#81b64c] text-[22px] text-[#16210d]" aria-hidden="true">
            ♞
          </span>
          <span>Chess Platform</span>
        </Link>

        <nav className="ml-auto flex min-w-max items-center gap-2 text-[13px] font-medium text-[#d5d1c8] sm:gap-3">
          <ThemeToggle className="hidden h-9 sm:inline-flex" />
          <Button asChild className="h-9 rounded-[8px] border-white/15 bg-white/[0.04] px-4 text-[13px] font-bold text-white hover:bg-white/[0.1]" variant="ghost">
            <Link href={loginHref}>Войти</Link>
          </Button>
          <Button asChild className="h-9 rounded-[8px] bg-[#81b64c] px-4 text-[13px] font-extrabold text-[#16210d] hover:bg-[#93c85c]">
            <Link href={signUpHref}>Регистрация</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
