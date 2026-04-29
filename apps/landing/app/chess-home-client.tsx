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

type BoardTheme = "classic" | "blue" | "wood";
type PieceStyle = "classic" | "neon" | "pixel";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);

const boardThemes: Record<BoardTheme, { label: string; light: string; dark: string }> = {
  classic: { label: "Классик", light: "#eeeed2", dark: "#769656" },
  blue: { label: "Синяя", light: "#d9e8f5", dark: "#4f7ea8" },
  wood: { label: "Дерево", light: "#f0c98b", dark: "#9c6537" }
};

const pieceStyles: Record<PieceStyle, { label: string }> = {
  classic: { label: "Классик" },
  neon: { label: "Неон" },
  pixel: { label: "Пиксель" }
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
            Play Chess
          </h1>
          <p className="mt-2 max-w-[520px] text-[15px] leading-[1.55] text-[var(--color-text-secondary)]">
            Choose a mode and start a focused chess session.
          </p>
        </div>
        <BoardPreview boardTheme="classic" pieceStyle="classic" />
      </div>

      <aside className="grid w-full max-w-[960px] min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <section className="grid gap-3" aria-label="Game modes">
          {modeCards.map((mode) => (
            <Link
              className="group flex min-h-[112px] items-start gap-4 rounded-[8px] border border-[#3a3a3a] bg-[var(--color-surface)] p-5 text-left transition duration-150 hover:-translate-y-0.5 hover:bg-[#3a3a3a] hover:shadow-[0_16px_38px_rgba(0,0,0,0.28)]"
              href={mode.href}
              key={mode.title}
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#1f1f1f] text-[22px]">
                {mode.icon}
              </span>
              <span>
                <span className="block text-[17px] font-bold leading-[1.25] text-white">{mode.title}</span>
                <span className="mt-2 block text-[13px] leading-[1.55] text-[#a0a0a0]">{mode.description}</span>
              </span>
            </Link>
          ))}
        </section>

        <section id="premium" className="rounded-[8px] border border-[#3a3a3a] bg-[var(--color-surface)] p-5">
          <div className="flex items-start gap-3">
            <span className="text-[24px]" aria-hidden="true">
              👑
            </span>
            <div>
              <h2 className="text-[19px] font-bold leading-[1.2] text-white">Premium</h2>
              <p className="mt-2 text-[14px] leading-[1.55] text-[#a0a0a0]">
                Разблокируй все возможности платформы
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-3 text-[14px] text-white">
            {["Неограниченные партии", "Анализ позиций с AI", "Эксклюзивные боты", "Расширенная статистика"].map(
              (feature) => (
                <li className="flex items-center gap-3" key={feature}>
                  <span className="text-[#81b64c]">✓</span>
                  <span>{feature}</span>
                </li>
              )
            )}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-[#3a3a3a] px-4 py-3">
              <p className="text-[13px] font-semibold text-white">Free</p>
              <p className="mt-1 text-[12px] text-[#a0a0a0]">Базовый доступ</p>
            </div>
            <div className="rounded-[8px] border border-[#81b64c] bg-[#223018] px-4 py-3">
              <p className="text-[13px] font-semibold text-white">Premium</p>
              <p className="mt-1 text-[12px] text-[#a0a0a0]">$9.99/мес</p>
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

function BoardPreview({ boardTheme, pieceStyle }: { boardTheme: BoardTheme; pieceStyle: PieceStyle }) {
  const colors = boardThemes[boardTheme];

  return (
    <div className="relative aspect-square w-full max-w-[640px] overflow-hidden rounded-[8px] border border-[#3a3a3a] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
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
                style={{ backgroundColor: isLight ? colors.light : colors.dark }}
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
                {piece ? <PieceGlyph piece={piece} styleName={pieceStyle} /> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PieceGlyph({ piece, styleName }: { piece: string; styleName: PieceStyle }) {
  const isWhite = "♔♕♖♗♘♙".includes(piece);

  if (styleName === "neon") {
    return (
      <span
        className="select-none text-[clamp(30px,7vw,58px)] leading-none"
        style={{
          color: isWhite ? "#f4ffe8" : "#101b0b",
          textShadow: isWhite ? "0 0 14px rgba(129,182,76,0.8)" : "0 0 12px rgba(0,0,0,0.55)"
        }}
      >
        {piece}
      </span>
    );
  }

  if (styleName === "pixel") {
    return (
      <span className="select-none font-mono text-[clamp(28px,6.4vw,52px)] font-bold leading-none text-[#161616]">
        {piece}
      </span>
    );
  }

  return (
    <span className="select-none text-[clamp(32px,7.2vw,60px)] leading-none text-[#151515] drop-shadow-[0_2px_2px_rgba(255,255,255,0.24)]">
      {piece}
    </span>
  );
}
