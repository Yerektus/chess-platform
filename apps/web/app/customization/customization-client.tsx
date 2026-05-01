"use client";

import { type Piece } from "@chess-platform/chess-engine";
import { Button, ChessPieceSvg } from "@chess-platform/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { type AuthUser } from "@/lib/auth-types";
import {
  boardThemes,
  defaultCustomization,
  getBoardThemeStyle,
  highlightColors,
  persistCustomization,
  pieceStyles,
  readCustomization,
  toCustomizationSettings,
  type CustomizationSettings
} from "@/lib/customization";

const pieceStylePreviewPiece: Piece = { color: "white", type: "king" };
const previewPieces: Array<Piece | null> = [
  { color: "black", type: "rook" },
  null,
  { color: "black", type: "king" },
  null,
  { color: "white", type: "pawn" },
  null,
  null,
  { color: "white", type: "king" }
];

export function CustomizationClient() {
  const router = useRouter();
  const { accessToken, updateUser, user } = useAuth();
  const [savedSettings, setSavedSettings] = useState<CustomizationSettings>(defaultCustomization);
  const [draft, setDraft] = useState<CustomizationSettings>(defaultCustomization);
  const [activeTab, setActiveTab] = useState<"board" | "pieces" | "other">("board");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPremium = user?.plan === "pro";

  useEffect(() => {
    const localSettings = readCustomization();
    setSavedSettings(localSettings);
    setDraft(localSettings);
  }, []);

  useEffect(() => {
    if (!user?.preferences) {
      return;
    }

    const profileSettings = toCustomizationSettings(user.preferences);
    persistCustomization(profileSettings);
    setSavedSettings(profileSettings);
    setDraft(profileSettings);
  }, [user?.preferences]);

  const updateDraft = (nextSettings: CustomizationSettings) => {
    setDraft(nextSettings);
    setStatus(null);
    setError(null);
  };

  const handleCancel = () => {
    setDraft(savedSettings);

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/game/local");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    setError(null);
    persistCustomization(draft);
    setSavedSettings(draft);

    if (!accessToken) {
      setStatus("Настройки сохранены в этом браузере.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/users/preferences", {
        body: JSON.stringify(draft),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });
      const payload = (await response.json().catch(() => null)) as AuthUser | { message?: string } | null;

      if (!response.ok || !payload || !("id" in payload)) {
        throw new Error((payload as { message?: string } | null)?.message ?? "Не удалось сохранить настройки");
      }

      updateUser(payload);
      setStatus("Настройки сохранены.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Не удалось сохранить настройки");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main
      className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)] px-4 py-6 text-[var(--color-text-primary)] md:px-6 md:py-8"
      style={getBoardThemeStyle(draft)}
    >
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
        <header>
          <h1 className="text-[32px] font-medium leading-[1.15]">Кастомизация</h1>
        </header>

        <section className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-1 rounded-[8px] border border-[var(--color-border)] p-1">
              {(["board", "pieces", "other"] as const).map((tab) => (
                <button
                  className={`min-h-11 rounded-[6px] px-3 text-[14px] font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {tab === "board" ? "Доска" : tab === "pieces" ? "Фигуры" : "Прочее"}
                </button>
              ))}
            </div>

            {activeTab === "board" ? (
              <div className="grid gap-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {Object.entries(boardThemes).map(([value, item]) => {
                    const locked = item.premium && !isPremium;

                    return (
                      <button
                        className={`aspect-square rounded-[8px] border-2 transition ${
                          draft.boardTheme === value ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
                        } ${locked ? "cursor-not-allowed opacity-45" : "hover:border-[var(--color-accent)]"}`}
                        disabled={locked}
                        key={value}
                        onClick={() =>
                          updateDraft({ ...draft, boardTheme: value as CustomizationSettings["boardTheme"] })
                        }
                        style={{ background: item.light }}
                        title={locked ? "Premium" : item.label}
                        type="button"
                      >
                        <span className="flex h-full w-full flex-col items-center justify-center gap-3">
                          <span className="h-7 w-7 rounded-[6px]" style={{ background: item.dark }} />
                          <span className="text-[13px] font-medium text-slate-900">{item.label}</span>
                          {locked ? <span className="text-[11px] text-slate-700">Premium</span> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <span className="text-[14px] text-[var(--color-text-secondary)]">Цвет подсветки</span>
                  <div className="flex flex-wrap gap-3">
                    {highlightColors.map((color) => {
                      const locked = color.premium && !isPremium;

                      return (
                        <button
                          aria-label={color.label}
                          className={`h-10 w-10 rounded-full border-2 transition ${
                            draft.highlightColor === color.value
                              ? "border-[var(--color-text-primary)]"
                              : "border-transparent"
                          } ${locked ? "cursor-not-allowed opacity-45" : ""}`}
                          disabled={locked}
                          key={color.value}
                          onClick={() => updateDraft({ ...draft, highlightColor: color.value })}
                          style={{ background: color.value }}
                          title={locked ? `${color.label}, Premium` : color.label}
                          type="button"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "pieces" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Object.entries(pieceStyles).map(([value, item]) => {
                  const locked = item.premium && !isPremium;
                  const styleName = value as CustomizationSettings["pieceStyle"];

                  return (
                    <button
                      className={`aspect-square rounded-[8px] border-2 bg-[var(--color-bg)] p-3 transition ${
                        draft.pieceStyle === value ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
                      } ${locked ? "cursor-not-allowed opacity-45" : "hover:border-[var(--color-accent)]"}`}
                      disabled={locked}
                      key={value}
                      onClick={() => updateDraft({ ...draft, pieceStyle: styleName })}
                      title={locked ? "Premium" : item.label}
                      type="button"
                    >
                      <span className="flex h-full flex-col items-center justify-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center">
                          {locked ? (
                            <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">Premium</span>
                          ) : (
                            <ChessPieceSvg piece={pieceStylePreviewPiece} styleName={styleName} />
                          )}
                        </span>
                        <span className="text-[13px] text-[var(--color-text-secondary)]">{item.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activeTab === "other" ? (
              <div className="grid gap-4">
                <ToggleRow
                  checked={draft.animations}
                  label="Анимация"
                  onChange={(value) => updateDraft({ ...draft, animations: value })}
                />
                <ToggleRow
                  checked={draft.sounds}
                  label="Звуки"
                  onChange={(value) => updateDraft({ ...draft, sounds: value })}
                />
              </div>
            ) : null}

            <div className="flex items-center gap-4 rounded-[8px] border border-[var(--color-border)] p-4">
              <div className="grid w-20 grid-cols-4 gap-[2px] font-mono text-sm">
                {previewPieces.map((piece, index) => (
                  <div
                    className="flex aspect-square items-center justify-center overflow-hidden"
                    key={index}
                    style={{ background: index % 2 === 0 ? "var(--color-square-light)" : "var(--color-square-dark)" }}
                  >
                    {piece ? <ChessPieceSvg piece={piece} styleName={draft.pieceStyle} /> : null}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[14px] font-medium">Превью</p>
                <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                  {boardThemes[draft.boardTheme].label}, {pieceStyles[draft.pieceStyle].label}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 md:flex-row md:items-center md:justify-between">
              <p className="min-h-5 text-[13px] text-[var(--color-text-secondary)]">{error ?? status}</p>
              <div className="flex gap-3">
                <Button className="min-h-11 flex-1 md:w-[180px]" onClick={handleCancel} variant="ghost">
                  Отмена
                </Button>
                <Button className="min-h-11 flex-1 md:w-[180px]" disabled={isSaving} onClick={() => void handleSave()}>
                  {isSaving ? "Сохраняем..." : "Сохранить"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ToggleRow({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--color-border)] p-4">
      <span className="text-[14px] text-[var(--color-text-secondary)]">{label}</span>
      <button
        aria-pressed={checked}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
        }`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span
          className={`absolute top-1 block h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
