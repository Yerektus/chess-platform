"use client";

import { type ReactNode } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { cx } from "./utils";

export type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  showCloseButton?: boolean;
};

export function Modal({ open, title, children, onClose, className, showCloseButton = true }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-modal-backdrop)] p-6"
      role="dialog"
    >
      <Card className={cx("w-full max-w-[480px]", className)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          {title ? <h2 className="text-[18px] font-medium leading-[1.2]">{title}</h2> : <div />}
          {showCloseButton ? (
            <Button aria-label="Close modal" onClick={onClose} variant="ghost">
              Close
            </Button>
          ) : null}
        </div>
        {children}
      </Card>
    </div>
  );
}
