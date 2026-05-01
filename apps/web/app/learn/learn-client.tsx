"use client";

import {
  applyMove,
  getLegalMoves,
  parseFEN,
  type BoardState,
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
  const [completedTemplateId, setCompletedTemplateId] = useState<string | null>(null);
  const [customization, setCustomization] = useState<CustomizationSettings>(defaultCustomization);

  useEffect(() => {
    setCustomization(readCustomization());
  }, []);

  useEffect(() => {
    setCompletedTemplateId(null);
  }, [selectedTemplate.id]);

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
          <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium text-[var(--color-text-secondary)]">
            <span className="rounded-[999px] border border-[var(--color-border)] px-3 py-1">6 шахматистов</span>
            <span className="rounded-[999px] border border-[var(--color-border)] px-3 py-1">точные фрагменты</span>
            <span className="rounded-[999px] border border-[var(--color-border)] px-3 py-1">учебные шаблоны</span>
          </div>
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
            onSelectTemplate={setSelectedTemplateId}
            selectedPlayer={selectedPlayer}
            selectedTemplate={selectedTemplate}
          />

          <TrainerBoard
            key={selectedTemplate.id}
            customization={customization}
            onComplete={() => setCompletedTemplateId(selectedTemplate.id)}
            onResetProgress={() => setCompletedTemplateId(null)}
            template={selectedTemplate}
          />

          <TemplateGuide isComplete={completedTemplateId === selectedTemplate.id} template={selectedTemplate} />
        </div>
      </div>
    </main>
  );
}

function PlayerTemplatePanel({
  onSelectPlayer,
  onSelectTemplate,
  selectedPlayer,
  selectedTemplate
}: {
  onSelectPlayer: (player: GreatPlayerTemplateSet) => void;
  onSelectTemplate: (templateId: string) => void;
  selectedPlayer: GreatPlayerTemplateSet;
  selectedTemplate: TrainingTemplate;
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

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-[18px] font-semibold">Шаблоны</h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-secondary)]">{selectedPlayer.styleSummary}</p>
        <div className="flex flex-col gap-2">
          {selectedPlayer.templates.map((template) => {
            const active = template.id === selectedTemplate.id;

            return (
              <button
                className={`rounded-[8px] border px-3 py-3 text-left transition-colors ${
                  active
                    ? "border-[var(--color-accent)] bg-[rgba(129,182,76,0.14)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                }`}
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                type="button"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-medium text-[var(--color-text-primary)]">{template.title}</span>
                  <TemplateKind kind={template.kind} />
                </span>
                <span className="mt-2 block text-[12px] text-[var(--color-text-secondary)]">{template.difficulty}</span>
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
  onComplete,
  onResetProgress,
  template
}: {
  customization: CustomizationSettings;
  onComplete: () => void;
  onResetProgress: () => void;
  template: TrainingTemplate;
}) {
  const [boardState, setBoardState] = useState<BoardState>(() => parseFEN(template.fen));
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState("Выберите фигуру и сделайте ход.");
  const [hintCount, setHintCount] = useState(0);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
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
    onResetProgress();
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

      const nextState = applyMove(boardState, selectedSquare, square, expectedMove.promotion);
      const nextStep = currentStep + 1;

      setBoardState(nextState);
      setCurrentStep(nextStep);
      setLastMove({ from: selectedSquare, to: square });
      setSelectedSquare(null);
      setFeedback(
        nextStep >= template.solutionMoves.length
          ? "Решение найдено. Разберите идею справа."
          : `Верно: ${expectedMove.notation}. Продолжайте линию.`
      );
      if (nextStep >= template.solutionMoves.length) {
        onComplete();
      }
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
    <section className="flex min-w-0 flex-col gap-4">
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

      <Card className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[13px] text-[var(--color-text-secondary)]">Статус</p>
            <p className="mt-1 text-[15px] leading-6">{feedback}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-10"
              disabled={hintCount >= template.hints.length || isComplete}
              onClick={() => setHintCount((count) => Math.min(template.hints.length, count + 1))}
              variant="ghost"
            >
              Подсказка
            </Button>
            <Button className="min-h-10" onClick={reset} variant="ghost">
              Заново
            </Button>
          </div>
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
    </section>
  );
}

function TemplateGuide({ isComplete, template }: { isComplete: boolean; template: TrainingTemplate }) {
  return (
    <aside className="flex flex-col gap-4">
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
