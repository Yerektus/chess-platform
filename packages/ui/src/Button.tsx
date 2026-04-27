"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "./utils";

export type ButtonVariant = "primary" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]",
  ghost:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, type = "button", variant = "primary", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inline-flex h-10 items-center justify-center rounded-[6px] px-5 text-[15px] font-normal leading-none transition-colors duration-150 ease-[ease] disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
