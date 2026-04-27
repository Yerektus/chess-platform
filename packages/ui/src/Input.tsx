"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "./utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cx(
        "h-10 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors duration-150 ease-[ease] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
