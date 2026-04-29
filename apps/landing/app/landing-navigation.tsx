"use client";

import { Button, ThemeToggle } from "@chess-platform/ui";
import Link from "next/link";

export function LandingNavigation({ loginHref, signUpHref }: { loginHref: string; signUpHref: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#242424] bg-[#1a1a1a]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-[15px] font-bold text-white">
          Chess Platform
        </Link>

        <nav className="ml-auto flex min-w-max items-center gap-3 text-[13px] font-medium text-[#a0a0a0]">
          <ThemeToggle className="h-9" />
          <Button asChild className="h-9 rounded-[8px] border-[#81b64c] px-4 text-[13px]" variant="ghost">
            <Link href={loginHref}>
              Log In
            </Link>
          </Button>
          <Button asChild className="h-9 rounded-[8px] px-4 text-[13px] font-semibold">
            <Link href={signUpHref}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
