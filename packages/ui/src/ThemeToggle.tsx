"use client";

import { useEffect, useState } from "react";
import { cx } from "./utils";

export type ThemeName = "light" | "dark";

export type ThemeToggleProps = {
  className?: string;
  onThemeChange?: (theme: ThemeName) => void;
};

export function ThemeToggle({ className, onThemeChange }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const selectTheme = (nextTheme: ThemeName) => {
    if (nextTheme === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    setTheme(nextTheme);
    onThemeChange?.(nextTheme);
  };

  return (
    <div
      aria-label="Theme"
      className={cx(
        "inline-flex h-10 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1",
        className
      )}
      role="group"
    >
      <button
        aria-pressed={theme === "light"}
        className={cx(
          "h-8 rounded-[4px] px-3 text-[13px] text-[var(--color-text-primary)] transition-colors duration-150 ease-[ease]",
          theme === "light" && "bg-[var(--color-accent)] text-[var(--color-bg)]"
        )}
        onClick={() => selectTheme("light")}
        type="button"
      >
        Light
      </button>
      <button
        aria-pressed={theme === "dark"}
        className={cx(
          "h-8 rounded-[4px] px-3 text-[13px] text-[var(--color-text-primary)] transition-colors duration-150 ease-[ease]",
          theme === "dark" && "bg-[var(--color-accent)] text-[var(--color-bg)]"
        )}
        onClick={() => selectTheme("dark")}
        type="button"
      >
        Dark
      </button>
    </div>
  );
}
