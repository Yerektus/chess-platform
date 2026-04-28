"use client";

import { Button } from "@chess-platform/ui";
import Link from "next/link";

export function LandingNavigation({ loginHref, signUpHref }: { loginHref: string; signUpHref: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#242424] bg-[#1a1a1a]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-[15px] font-bold text-white">
          Chess Platform
        </Link>

        <nav className="flex min-w-max flex-1 items-center gap-6 text-[13px] font-medium text-[#a0a0a0]">
          <Link href="#play" className="border-b-2 border-[#81b64c] py-5 text-[#81b64c]">
            Play
          </Link>
          <Link href="#premium" className="py-5 transition-colors hover:text-white">
            Premium
          </Link>
          <Link href="#customization" className="py-5 transition-colors hover:text-white">
            Customization
          </Link>
          <Button asChild className="ml-auto h-9 rounded-[8px] border-[#81b64c] px-4 text-[13px]" variant="ghost">
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
