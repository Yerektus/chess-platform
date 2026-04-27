import { type HTMLAttributes } from "react";
import { cx } from "./utils";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)]",
        className
      )}
      {...props}
    />
  );
}
