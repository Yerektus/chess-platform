"use client";

import { Button } from "@chess-platform/ui";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useMemo, useState } from "react";

type ChessHomeClientProps = {
  aiGameHref: string;
  localGameHref: string;
  onlineGameHref: string;
  profileHref: string;
};

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);

const boardColors = {
  light: "#eeeed2",
  dark: "#769656"
};

const initialBoard = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "♙", "", "", "", ""],
  ["", "", "", "", "♘", "", "", ""],
  ["♙", "♙", "♙", "", "♙", "♙", "♙", "♙"],
  ["♖", "", "♗", "♕", "♔", "♗", "♘", "♖"]
];

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

export function ChessHomeClient({ aiGameHref, localGameHref, onlineGameHref, profileHref }: ChessHomeClientProps) {
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");

  const modeCards = useMemo(
    () => [
      {
        icon: "⚡",
        title: "Играть онлайн",
        description: "Партия против игрока схожего уровня в реальном времени",
        href: onlineGameHref
      },
      {
        icon: "🤖",
        title: "Игра с ботом",
        description: "Выбери уровень сложности: от лёгкого до мастера",
        href: aiGameHref
      },
      {
        icon: "👤",
        title: "Один игрок",
        description: "Анализ позиций и игра против самого себя",
        href: localGameHref
      }
    ],
    [aiGameHref, localGameHref, onlineGameHref]
  );

  const openCheckout = async () => {
    setCheckoutState("loading");

    try {
      await stripePromise;
      window.open(profileHref, "_blank", "noopener,noreferrer");
      setCheckoutState("idle");
    } catch {
      setCheckoutState("error");
    }
  };

  return (
    <section id="play" className="mx-auto flex max-w-[1280px] flex-col items-center gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex w-full max-w-[640px] flex-col gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-[1.1] text-[var(--color-text-primary)] sm:text-[44px]">
            Играй в шахматы
          </h1>
          <p className="mt-2 max-w-[520px] text-[15px] leading-[1.55] text-[var(--color-text-secondary)]">
            Выбери режим и начни партию.
          </p>
        </div>
        <BoardPreview />
      </div>

      <aside className="grid w-full max-w-[960px] min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <section className="grid gap-3" aria-label="Game modes">
          {modeCards.map((mode) => (
            <Link
              className="group flex min-h-[112px] items-start gap-4 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left transition duration-150 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-[0_16px_38px_rgba(0,0,0,0.18)]"
              href={mode.href}
              key={mode.title}
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-bg)] text-[22px]">
                {mode.icon}
              </span>
              <span>
                <span className="block text-[17px] font-bold leading-[1.25] text-[var(--color-text-primary)]">{mode.title}</span>
                <span className="mt-2 block text-[13px] leading-[1.55] text-[var(--color-text-secondary)]">{mode.description}</span>
              </span>
            </Link>
          ))}
        </section>

        <section id="premium" className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-start gap-3">
            <span className="text-[24px]" aria-hidden="true">
              👑
            </span>
            <div>
              <h2 className="text-[19px] font-bold leading-[1.2] text-[var(--color-text-primary)]">Premium</h2>
              <p className="mt-2 text-[14px] leading-[1.55] text-[var(--color-text-secondary)]">
                Разблокируй все возможности платформы
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-3 text-[14px] text-[var(--color-text-primary)]">
            {["Неограниченные партии", "Анализ позиций с AI", "Эксклюзивные боты", "Расширенная статистика"].map(
              (feature) => (
                <li className="flex items-center gap-3" key={feature}>
                  <span className="text-[var(--color-accent)]">✓</span>
                  <span>{feature}</span>
                </li>
              )
            )}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-[var(--color-border)] px-4 py-3">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Free</p>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">Базовый доступ</p>
            </div>
            <div className="rounded-[8px] border border-[var(--color-accent)] bg-[rgba(129,182,76,0.16)] px-4 py-3">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Premium</p>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">$9.99/мес</p>
            </div>
          </div>

          <Button className="mt-4 h-11 w-full rounded-[8px] font-semibold" disabled={checkoutState === "loading"} onClick={openCheckout}>
            {checkoutState === "loading" ? "Открываем Stripe..." : "Оплатить через Stripe →"}
          </Button>
          {checkoutState === "error" ? (
            <p className="mt-3 text-[12px] leading-[1.5] text-[#ffb4a8]">
              Не удалось открыть Stripe Checkout. Проверь публичный ключ и price id.
            </p>
          ) : null}
        </section>
      </aside>
    </section>
  );
}

function BoardPreview() {
  return (
    <div className="relative aspect-square w-full max-w-[640px] overflow-hidden rounded-[8px] border border-[var(--color-border)] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {initialBoard.flatMap((row, rowIndex) =>
          row.map((piece, columnIndex) => {
            const isLight = (rowIndex + columnIndex) % 2 === 0;
            const showFile = rowIndex === 7;
            const showRank = columnIndex === 0;

            return (
              <div
                className="relative flex items-center justify-center"
                key={`${rowIndex}-${columnIndex}`}
                style={{ backgroundColor: isLight ? boardColors.light : boardColors.dark }}
              >
                {showRank ? (
                  <span className="absolute left-1.5 top-1.5 font-mono text-[11px] font-bold text-black/55 sm:text-[13px]">
                    {ranks[rowIndex]}
                  </span>
                ) : null}
                {showFile ? (
                  <span className="absolute bottom-1.5 right-1.5 font-mono text-[11px] font-bold text-black/55 sm:text-[13px]">
                    {files[columnIndex]}
                  </span>
                ) : null}
                {piece ? <PieceGlyph piece={piece} /> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PieceGlyph({ piece }: { piece: string }) {
  return (
    <span className="select-none text-[clamp(32px,7.2vw,60px)] leading-none text-[#151515] drop-shadow-[0_2px_2px_rgba(255,255,255,0.24)]">
      {piece}
    </span>
  );
}
