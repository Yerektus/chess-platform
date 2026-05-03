"use client";

import {
  applyMove,
  getLegalMoves,
  parseFEN,
  type BoardState,
  type Color,
  type Square
} from "@chess-platform/chess-engine";
import { Button, Card, ChessBoard } from "@chess-platform/ui";
import { useEffect, useMemo, useState } from "react";
import {
  defaultCustomization,
  getBoardThemeStyle,
  readCustomization,
  type CustomizationSettings
} from "@/lib/customization";
import { greatPlayerTemplates, type GreatPlayerTemplateSet, type TrainingTemplate } from "./learn-data";

type LastMove = {
  from: Square;
  to: Square;
};

export function LearnClient() {
  const [selectedPlayerId, setSelectedPlayerId] = useState(greatPlayerTemplates[0]?.id ?? "");
  const selectedPlayer = useMemo(
    () => greatPlayerTemplates.find((player) => player.id === selectedPlayerId) ?? greatPlayerTemplates[0],
    [selectedPlayerId]
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(selectedPlayer.templates[0]?.id ?? "");
  const selectedTemplate = useMemo(
    () => selectedPlayer.templates.find((template) => template.id === selectedTemplateId) ?? selectedPlayer.templates[0],
    [selectedPlayer, selectedTemplateId]
  );
  const [customization, setCustomization] = useState<CustomizationSettings>(defaultCustomization);

  useEffect(() => {
    setCustomization(readCustomization());
  }, []);

  const handleSelectPlayer = (player: GreatPlayerTemplateSet) => {
    setSelectedPlayerId(player.id);
    setSelectedTemplateId(player.templates[0]?.id ?? "");
  };

  return (
    <main
      className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)] px-4 py-6 text-[var(--color-text-primary)] md:px-6 md:py-8"
      style={getBoardThemeStyle(customization)}
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight md:text-[36px]">Обучение по великим шахматистам</h1>
            <p className="mt-2 max-w-[780px] text-[15px] leading-6 text-[var(--color-text-secondary)]">
              Выберите стиль игрока, найдите ход на доске и пройдите короткую линию до объяснения идеи.
            </p>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <PlayerTemplatePanel
            onSelectPlayer={handleSelectPlayer}
            selectedPlayer={selectedPlayer}
          />

          <TrainerBoard
            key={selectedTemplate.id}
            customization={customization}
            template={selectedTemplate}
          />
        </div>
      </div>
    </main>
  );
}

function PlayerTemplatePanel({
  onSelectPlayer,
  selectedPlayer
}: {
  onSelectPlayer: (player: GreatPlayerTemplateSet) => void;
  selectedPlayer: GreatPlayerTemplateSet;
}) {
  return (
    <aside className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-[18px] font-semibold">Игроки</h2>
        <div className="flex flex-col gap-2">
          {greatPlayerTemplates.map((player) => {
            const active = player.id === selectedPlayer.id;

            return (
              <button
                className={`rounded-[8px] border px-3 py-3 text-left transition-colors ${
                  active
                    ? "border-[var(--color-accent)] bg-[rgba(129,182,76,0.14)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                }`}
                key={player.id}
                onClick={() => onSelectPlayer(player)}
                type="button"
              >
                <span className="block text-[14px] font-semibold text-[var(--color-text-primary)]">{player.player}</span>
                <span className="mt-1 block text-[12px] text-[var(--color-text-secondary)]">{player.accent}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </aside>
  );
}

function TrainerBoard({
  customization,
  template
}: {
  customization: CustomizationSettings;
  template: TrainingTemplate;
}) {
  const [boardState, setBoardState] = useState<BoardState>(() => parseFEN(template.fen));
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState("Выберите фигуру и сделайте ход.");
  const [hintCount, setHintCount] = useState(0);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const trainingColor = useMemo<Color>(() => parseFEN(template.fen).turn, [template.fen]);
  const isComplete = currentStep >= template.solutionMoves.length;
  const expectedMove = template.solutionMoves[currentStep] ?? null;
  const legalMoves = useMemo(
    () => (selectedSquare && !isComplete ? getLegalMoves(boardState, selectedSquare) : []),
    [boardState, isComplete, selectedSquare]
  );

  const reset = () => {
    setBoardState(parseFEN(template.fen));
    setCurrentStep(0);
    setFeedback("Позиция сброшена. Найдите первый ход.");
    setHintCount(0);
    setLastMove(null);
    setSelectedSquare(null);
  };

  const handleSquareClick = (square: Square) => {
    if (isComplete || !expectedMove) {
      return;
    }

    const piece = boardState.squares[square];

    if (selectedSquare && legalMoves.includes(square)) {
      const isExpected =
        expectedMove.from === selectedSquare &&
        expectedMove.to === square;

      if (!isExpected) {
        setFeedback("Ход легальный, но это не шаблон решения. Попробуйте найти более forcing-ход.");
        return;
      }

      let nextState = applyMove(boardState, selectedSquare, square, expectedMove.promotion);
      let nextStep = currentStep + 1;
      let nextLastMove: LastMove = { from: selectedSquare, to: square };
      let autoReplyNotation: string | null = null;
      const autoReply = template.solutionMoves[nextStep] ?? null;

      if (autoReply) {
        const autoReplyPiece = nextState.squares[autoReply.from];
        const isOpponentReply = autoReplyPiece?.color === nextState.turn && autoReplyPiece.color !== trainingColor;
        const isLegalReply = getLegalMoves(nextState, autoReply.from).includes(autoReply.to);

        if (isOpponentReply && isLegalReply) {
          nextState = applyMove(nextState, autoReply.from, autoReply.to, autoReply.promotion);
          nextStep += 1;
          nextLastMove = { from: autoReply.from, to: autoReply.to };
          autoReplyNotation = autoReply.notation;
        }
      }

      setBoardState(nextState);
      setCurrentStep(nextStep);
      setLastMove(nextLastMove);
      setSelectedSquare(null);
      setFeedback(
        autoReplyNotation && nextStep >= template.solutionMoves.length
          ? `Верно: ${expectedMove.notation}. Оппонент ответил: ${autoReplyNotation}. Решение найдено.`
          : autoReplyNotation
            ? `Верно: ${expectedMove.notation}. Оппонент ответил: ${autoReplyNotation}. Продолжайте линию.`
            : nextStep >= template.solutionMoves.length
          ? "Решение найдено. Разберите идею справа."
          : `Верно: ${expectedMove.notation}. Продолжайте линию.`
      );
      return;
    }

    if (piece?.color === boardState.turn) {
      setSelectedSquare(square);
      setFeedback(`Выбрано поле ${square}.`);
      return;
    }

    setSelectedSquare(null);
    setFeedback("Выберите фигуру стороны, которая сейчас ходит.");
  };

  return (
    <section className="grid min-w-0 gap-4 xl:col-span-2 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card className="flex flex-col gap-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TemplateKind kind={template.kind} />
                <span className="rounded-[999px] border border-[var(--color-border)] px-3 py-1 text-[12px] text-[var(--color-text-secondary)]">
                  {template.difficulty}
                </span>
              </div>
              <h2 className="mt-3 text-[24px] font-semibold leading-tight">{template.title}</h2>
              {template.sourceLabel ? (
                <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">{template.sourceLabel}</p>
              ) : null}
            </div>
            <Button className="min-h-10 shrink-0" onClick={reset} variant="ghost">
              Сбросить
            </Button>
          </div>

          <div className="mx-auto w-full max-w-[680px]">
            <ChessBoard
              className="mx-auto max-w-[min(100%,680px)]"
              lastMove={lastMove}
              legalMoves={legalMoves}
              onSquareClick={handleSquareClick}
              orientation={template.orientation}
              pieceStyle={customization.pieceStyle}
              selectedSquare={selectedSquare}
              state={boardState}
            />
          </div>
        </Card>
      </div>

      <TemplateGuide
        feedback={feedback}
        hintCount={hintCount}
        isComplete={isComplete}
        onHint={() => setHintCount((count) => Math.min(template.hints.length, count + 1))}
        onReset={reset}
        template={template}
      />
    </section>
  );
}

function TemplateGuide({
  feedback,
  hintCount,
  isComplete,
  onHint,
  onReset,
  template
}: {
  feedback: string;
  hintCount: number;
  isComplete: boolean;
  onHint: () => void;
  onReset: () => void;
  template: TrainingTemplate;
}) {
  return (
    <aside className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-[13px] text-[var(--color-text-secondary)]">Статус</p>
          <p className="mt-1 text-[15px] leading-6">{feedback}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            className="min-h-10"
            disabled={hintCount >= template.hints.length || isComplete}
            onClick={onHint}
            variant="ghost"
          >
            Подсказка
          </Button>
          <Button className="min-h-10" onClick={onReset} variant="ghost">
            Заново
          </Button>
        </div>

        {hintCount > 0 ? (
          <div className="grid gap-2">
            {template.hints.slice(0, hintCount).map((hint, index) => (
              <div
                className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] leading-5 text-[var(--color-text-secondary)]"
                key={hint}
              >
                {index + 1}. {hint}
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <div>
          <p className="text-[13px] text-[var(--color-text-secondary)]">Цель позиции</p>
          <p className="mt-2 text-[16px] leading-6">{template.goal}</p>
        </div>

        <div>
          <p className="text-[13px] text-[var(--color-text-secondary)]">Линия решения</p>
          {isComplete ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {template.solutionMoves.map((move) => (
                <span
                  className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-[13px]"
                  key={`${move.from}-${move.to}-${move.notation}`}
                >
                  {move.notation}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              Откроется после решения.
            </p>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-[18px] font-semibold">Идея</h2>
        {isComplete ? (
          <p className="text-[14px] leading-6 text-[var(--color-text-secondary)]">{template.explanation}</p>
        ) : (
          <p className="text-[14px] leading-6 text-[var(--color-text-secondary)]">
            Сначала найдите все ходы решения на доске.
          </p>
        )}
      </Card>
    </aside>
  );
}

function TemplateKind({ kind }: { kind: TrainingTemplate["kind"] }) {
  return (
    <span
      className={`shrink-0 rounded-[999px] px-2.5 py-1 text-[11px] font-medium ${
        kind === "exact"
          ? "bg-[rgba(129,182,76,0.16)] text-[var(--color-accent)]"
          : "bg-[var(--color-bg)] text-[var(--color-text-secondary)]"
      }`}
    >
      {kind === "exact" ? "партия" : "стиль"}
    </span>
  );
}
