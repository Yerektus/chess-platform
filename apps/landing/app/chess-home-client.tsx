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

type ModeCard = {
  accent: string;
  description: string;
  href: string;
  label: string;
  stat: string;
  title: string;
};

type FeatureBlock = {
  description: string;
  href: string;
  kicker: string;
  title: string;
};

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);

const boardColors = {
  light: "#e9edc9",
  dark: "#7c9a57"
};

const initialBoard = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "♟", "", "♟", "♟", "♟", "♟"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "♟", "", "", "", ""],
  ["", "", "♗", "♙", "", "", "", ""],
  ["", "", "", "", "♘", "", "", ""],
  ["♙", "♙", "♙", "", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "", "♕", "♔", "", "", "♖"]
];

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
const subscriptionComparison = [
  { feature: "Офлайн-партии", free: "Да", pro: "Да" },
  { feature: "Игра с ботом", free: "Да", pro: "Да" },
  { feature: "AI-разбор", free: "Базовый", pro: "Глубокий" },
  { feature: "Статистика точности", free: "Стандарт", pro: "Расширенная" },
  { feature: "Кастомизация", free: "Стандарт", pro: "Premium" },
  { feature: "История ревью", free: "Ограничено", pro: "Безлимитно" }
];

export function ChessHomeClient({ aiGameHref, localGameHref, onlineGameHref, profileHref }: ChessHomeClientProps) {
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const learnHref = resolveAppHref("/learn", onlineGameHref);
  const leaderboardHref = resolveAppHref("/leaderboard", onlineGameHref);
  const customizationHref = resolveAppHref("/customization", onlineGameHref);

  const modeCards = useMemo<ModeCard[]>(
    () => [
      {
        accent: "bg-[#81b64c]",
        description: "Быстрый матч с игроком твоего уровня и понятным темпом партии.",
        href: onlineGameHref,
        label: "01",
        stat: "Real-time",
        title: "Онлайн"
      },
      {
        accent: "bg-[#f0b95a]",
        description: "Тренируй дебюты и эндшпили против бота без ожидания соперника.",
        href: aiGameHref,
        label: "02",
        stat: "AI Coach",
        title: "С ботом"
      },
      {
        accent: "bg-[#74a7d8]",
        description: "Разбирай позиции, тестируй идеи и играй локальные партии на одной доске.",
        href: localGameHref,
        label: "03",
        stat: "Practice",
        title: "Локально"
      }
    ],
    [aiGameHref, localGameHref, onlineGameHref]
  );

  const featureBlocks = useMemo<FeatureBlock[]>(
    () => [
      {
        description: "Отрабатывай тактику, эндшпили и типовые идеи перед реальными партиями.",
        href: learnHref,
        kicker: "Learn",
        title: "Уроки и тренировки"
      },
      {
        description: "Смотри рейтинг игроков, сравнивай прогресс и находи соперников по уровню.",
        href: leaderboardHref,
        kicker: "ELO",
        title: "Лидерборд"
      },
      {
        description: "Настраивай доску, фигуры и визуальный стиль под свой темп игры.",
        href: customizationHref,
        kicker: "Style",
        title: "Кастомизация"
      },
      {
        description: "Разбирай партии через Stockfish и смотри, где позиция начала меняться.",
        href: aiGameHref,
        kicker: "Review",
        title: "AI-разбор"
      }
    ],
    [aiGameHref, customizationHref, leaderboardHref, learnHref]
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
    <div className="overflow-hidden bg-[#1f1e1b] text-white">
      <section
        id="play"
        className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-[1280px] items-center gap-10 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:py-12"
      >
        <div className="order-2 mx-auto w-full max-w-[640px]">
          <BoardPreview />
        </div>

        <div className="order-1 mx-auto flex w-full max-w-[620px] flex-col items-center text-center">
          <p className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d6e8c0]">
            Играй, тренируйся, разбирай партии
          </p>
          <h1 className="mt-5 max-w-[620px] text-[38px] font-extrabold leading-[1.03] tracking-normal text-white sm:text-[54px] lg:text-[64px]">
            Шахматы, в которые хочется сыграть сразу
          </h1>
          <p className="mt-5 max-w-[520px] text-[16px] font-medium leading-[1.65] text-[#d5d1c8] sm:text-[18px]">
            Быстрые онлайн-партии, тренировка с ботом и разбор позиций в одном спокойном интерфейсе.
          </p>

          <div className="mt-7 w-full max-w-[360px] lg:max-w-[380px]">
            <Link
              className="inline-flex min-h-[58px] w-full items-center justify-center rounded-[8px] bg-[#81b64c] px-6 py-4 text-center text-[18px] font-extrabold leading-none text-[#16210d] shadow-[0_6px_0_#5f8d35] transition-colors duration-150 hover:bg-[#93c85c]"
              href={localGameHref}
            >
              Играть
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#262522] px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="modes-title">
        <div className="mx-auto grid max-w-[1280px] gap-5">
          <div>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#a8c985]">Режимы игры</p>
                <h2 id="modes-title" className="mt-2 text-[28px] font-extrabold leading-[1.12] text-white sm:text-[34px]">
                  Выбери формат партии
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {modeCards.map((mode) => (
                <Link
                  className="group min-h-[214px] rounded-[8px] border border-white/10 bg-[#302f2b] p-5 transition duration-150 hover:-translate-y-1 hover:border-[#81b64c] hover:bg-[#35342f] hover:shadow-[0_18px_42px_rgba(0,0,0,0.3)]"
                  href={mode.href}
                  key={mode.title}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-bold text-[#928c81]">{mode.label}</span>
                    <span className={`h-3 w-3 rounded-full ${mode.accent}`} aria-hidden="true" />
                  </span>
                  <span className="mt-10 block text-[26px] font-extrabold leading-none text-white">{mode.title}</span>
                  <span className="mt-4 block text-[14px] leading-[1.55] text-[#c8c3b8]">{mode.description}</span>
                  <span className="mt-7 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[#a8c985]">
                    {mode.stat}
                    <span className="transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <section id="premium" className="rounded-[8px] border border-white/10 bg-[#302f2b] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.26)]">
            <div className="rounded-[8px] border border-[#81b64c]/45 bg-[#202d19] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#b7e18d]">Подписка</p>
                  <h2 className="mt-2 text-[30px] font-extrabold leading-none text-white">Pro</h2>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-[42px] font-extrabold leading-none text-white">$9.99</span>
                <span className="pb-1 text-[14px] font-semibold text-[#c8c3b8]">/ месяц</span>
              </div>
              <p className="mt-3 text-[14px] leading-[1.55] text-[#d7e7c8]">
                Для игроков, которые хотят видеть ошибки, улучшать точность и сохранять прогресс.
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-[8px] border border-white/10" role="table" aria-label="Сравнение подписок">
              <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(68px,0.7fr)_minmax(68px,0.7fr)] bg-white/[0.05] text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#a8c985]" role="row">
                <span className="px-3 py-3" role="columnheader">
                  Возможность
                </span>
                <span className="px-2 py-3 text-center" role="columnheader">
                  Free
                </span>
                <span className="bg-[#81b64c]/15 px-2 py-3 text-center text-[#d7f4b8]" role="columnheader">
                  Pro
                </span>
              </div>
              {subscriptionComparison.map((item) => (
                <ComparisonRow feature={item.feature} free={item.free} key={item.feature} pro={item.pro} />
              ))}
            </div>

            <Button
              className="mt-5 h-12 w-full rounded-[8px] bg-[#81b64c] text-[15px] font-extrabold text-[#16210d] shadow-[0_5px_0_#5f8d35] hover:bg-[#93c85c]"
              disabled={checkoutState === "loading"}
              onClick={openCheckout}
            >
              {checkoutState === "loading" ? "Открываем Stripe..." : "Оформить Pro"}
            </Button>
            <p className="mt-3 text-center text-[12px] font-medium leading-[1.5] text-[#a9a49a]">
              Оплата откроется в профиле. Доступ к Pro появится после подтверждения.
            </p>
            {checkoutState === "error" ? (
              <p className="mt-3 text-[12px] leading-[1.5] text-[#ffb4a8]">
                Не удалось открыть Stripe Checkout. Проверь публичный ключ и price id.
              </p>
            ) : null}
          </section>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#1f1e1b] px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="features-title">
        <div className="mx-auto max-w-[1280px]">
          <div className="max-w-[680px]">
            <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#a8c985]">Возможности платформы</p>
            <h2 id="features-title" className="mt-2 text-[28px] font-extrabold leading-[1.12] text-white sm:text-[36px]">
              Не только доска, а полный цикл тренировки
            </h2>
            <p className="mt-3 text-[15px] leading-[1.65] text-[#bdb8ad]">
              После партии можно учиться, сравнивать рейтинг, менять внешний вид и возвращаться к разбору ошибок.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {featureBlocks.map((feature) => (
              <Link
                className="group flex min-h-[220px] flex-col justify-between rounded-[8px] border border-white/10 bg-[#302f2b] p-5 transition duration-150 hover:-translate-y-1 hover:border-[#81b64c] hover:bg-[#35342f] hover:shadow-[0_18px_42px_rgba(0,0,0,0.3)]"
                href={feature.href}
                key={feature.title}
              >
                <span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#a8c985]">{feature.kicker}</span>
                  <span className="mt-6 block text-[24px] font-extrabold leading-[1.08] text-white">{feature.title}</span>
                  <span className="mt-4 block text-[14px] leading-[1.6] text-[#c8c3b8]">{feature.description}</span>
                </span>
                <span className="mt-7 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[#a8c985]">
                  Открыть
                  <span className="transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function BoardPreview() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px] rounded-[8px] bg-[#151512] p-2 shadow-[0_32px_90px_rgba(0,0,0,0.42)] sm:p-3">
      <div className="absolute -right-2 top-8 z-20 hidden rounded-[8px] border border-white/10 bg-[#2f2e2a]/95 px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.3)] sm:block">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#a8c985]">Live</p>
        <p className="mt-1 text-[14px] font-bold text-white">Ход белых</p>
      </div>
      <div className="absolute -bottom-3 left-5 z-20 hidden rounded-[8px] border border-white/10 bg-[#2f2e2a]/95 px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.3)] sm:block">
        <p className="text-[12px] font-bold text-[#d5d1c8]">Точность</p>
        <p className="mt-1 text-[20px] font-extrabold leading-none text-white">91%</p>
      </div>
      <div className="grid h-full w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-[8px] border border-black/30" aria-label="Chess board preview">
        {initialBoard.flatMap((row, rowIndex) =>
          row.map((piece, columnIndex) => {
            const isLight = (rowIndex + columnIndex) % 2 === 0;
            const showFile = rowIndex === 7;
            const showRank = columnIndex === 0;
            const isHighlight = (rowIndex === 4 && columnIndex === 2) || (rowIndex === 2 && columnIndex === 4);

            return (
              <div
                className="relative flex items-center justify-center"
                key={`${rowIndex}-${columnIndex}`}
                style={{ backgroundColor: isLight ? boardColors.light : boardColors.dark }}
              >
                {isHighlight ? <span className="absolute inset-0 bg-[#f3d35f]/45" /> : null}
                {showRank ? (
                  <span className="absolute left-1.5 top-1.5 font-mono text-[10px] font-extrabold text-black/55 sm:text-[13px]">
                    {ranks[rowIndex]}
                  </span>
                ) : null}
                {showFile ? (
                  <span className="absolute bottom-1.5 right-1.5 font-mono text-[10px] font-extrabold text-black/55 sm:text-[13px]">
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
    <span className="relative z-10 select-none text-[clamp(30px,7vw,62px)] leading-none text-[#151515] drop-shadow-[0_2px_1px_rgba(255,255,255,0.25)]">
      {piece}
    </span>
  );
}

function ComparisonRow({ feature, free, pro }: { feature: string; free: string; pro: string }) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1.2fr)_minmax(68px,0.7fr)_minmax(68px,0.7fr)] border-t border-white/10 text-[12px] font-semibold"
      role="row"
    >
      <span className="px-3 py-3 text-[#f0eee8]" role="cell">
        {feature}
      </span>
      <span className="px-2 py-3 text-center text-[#bdb8ad]" role="cell">
        {free}
      </span>
      <span className="bg-[#81b64c]/10 px-2 py-3 text-center font-extrabold text-[#d7f4b8]" role="cell">
        {pro}
      </span>
    </div>
  );
}

function resolveAppHref(path: string, baseHref: string): string {
  try {
    return new URL(path, baseHref).toString();
  } catch {
    return path;
  }
}
