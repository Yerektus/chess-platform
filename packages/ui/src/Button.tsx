"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode
} from "react";
import { cx } from "./utils";

export type ButtonVariant = "primary" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children?: ReactNode;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]",
  ghost:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild = false, children, className, type = "button", variant = "primary", ...props },
  ref
) {
  const classes = cx(
    "inline-flex h-10 items-center justify-center rounded-[6px] px-5 text-[15px] font-normal leading-none transition-colors duration-150 ease-[ease] disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    className
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string } & Record<string, unknown>>;

    return cloneElement(child, {
      ...props,
      className: cx(classes, child.props.className)
    });
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
});
