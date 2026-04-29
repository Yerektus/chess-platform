"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button, Card, Input } from "@chess-platform/ui";
import Link from "next/link";
import { type FormEvent, useState } from "react";

export function RegisterForm() {
  const { register, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      await register({
        username: String(formData.get("username") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? "")
      });
      window.location.assign("/profile");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to register");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text-primary)]">
      <Card className="w-full max-w-[420px]">
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div>
            <h1 className="text-[24px] font-medium leading-[1.2]">Create account</h1>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">Start a Chess Platform profile.</p>
          </div>

          <label className="flex flex-col gap-2 text-[13px]">
            Username
            <Input autoComplete="username" name="username" required />
          </label>
          <label className="flex flex-col gap-2 text-[13px]">
            Email
            <Input autoComplete="email" name="email" required type="email" />
          </label>
          <label className="flex flex-col gap-2 text-[13px]">
            Password
            <Input autoComplete="new-password" minLength={8} name="password" required type="password" />
          </label>

          {error ? <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p> : null}

          <Button disabled={isLoading} type="submit">
            Sign up
          </Button>
          <Link className="text-[13px] text-[var(--color-text-secondary)]" href="/login">
            Log in instead
          </Link>
        </form>
      </Card>
    </main>
  );
}
