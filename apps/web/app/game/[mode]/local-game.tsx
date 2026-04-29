"use client";

import {
  applyMove,
  getGameStatus,
  getLegalMoves,
  parseFEN,
  toFEN,
  type BoardState,
  type Color,
  type Piece,
  type PieceType,
  type Square
} from "@chess-platform/chess-engine";
import { Button, Card, ChessBoard, ChessPieceSvg, Modal } from "@chess-platform/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { type AuthUser } from "@/lib/auth-types";
import { useStockfish } from "@/hooks/use-stockfish";

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

type RouteMode = "local" | "bot" | "online" | "ai";
type GameMode = "local" | "bot" | "online";
type BotDifficulty = "beginner" | "casual" | "intermediate" | "advanced" | "master" | "grandmaster";
type TimeControl = "1+0" | "3+2" | "10";
type LocalTimeControl = "unlimited" | "5+0" | "10+0" | "15+10";

type LastMove = {
  from: Square;
  to: Square;
};

type MoveRecord = LastMove & {
  color: Color;
  durationSeconds: number;
  fen: string;
  moveNumber: number;
  notation: string;
  ply: number;
};

type CapturedPiece = {
  capturedBy: Color;
  piece: Piece;
};

type MoveRow = {
  black: MoveRecord | null;
  moveNumber: number;
  white: MoveRecord | null;
};

type ResultInfo = {
  title: string;
  subtitle: string;
  winner: Color | "draw" | null;
};

type MoveClassification = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

type AnalysisMove = {
  moveNumber: number;
  color: Color;
  san: string;
  eval: number;
  classification: MoveClassification;
  bestMove: string;
  comment?: string;
};

type AnalysisResult = {
  accuracy: Record<Color, number>;
  moves: AnalysisMove[];
  summary: {
    blunders: Record<Color, number>;
    mistakes: Record<Color, number>;
    inaccuracies: Record<Color, number>;
  };
};

type CustomizationSettings = {
  boardTheme: "green" | "blue" | "wood" | "marble";
  pieceStyle: "classic" | "neon" | "pixel" | "premium";
  highlightColor: "#f0c040" | "#3b82f6" | "#81b64c" | "#cc3030";
  animations: boolean;
  sounds: boolean;
};

const aiColorByPlayerColor: Record<Color, Color> = {
  black: "white",
  white: "black"
};

const botDepthByDifficulty: Record<BotDifficulty, number> = {
  beginner: 2,
  casual: 4,
  intermediate: 7,
  advanced: 10,
  master: 13,
  grandmaster: 16
};

const difficultyLabels: Array<{ label: string; value: BotDifficulty }> = [
  { label: "Новичок", value: "beginner" },
  { label: "Любитель", value: "casual" },
  { label: "Средний", value: "intermediate" },
  { label: "Продвинутый", value: "advanced" },
  { label: "Мастер", value: "master" },
  { label: "Гроссмейстер", value: "grandmaster" }
];

const timeControls: Array<{ label: string; value: TimeControl }> = [
  { label: "Пуля 1+0", value: "1+0" },
  { label: "Блиц 3+2", value: "3+2" },
  { label: "Рапид 10", value: "10" }
];

const localTimeControls: Array<{ label: string; value: LocalTimeControl }> = [
  { label: "Без лимита", value: "unlimited" },
  { label: "5+0", value: "5+0" },
  { label: "10+0", value: "10+0" },
  { label: "15+10", value: "15+10" }
];

const defaultCustomization: CustomizationSettings = {
  animations: true,
  boardTheme: "green",
  highlightColor: "#81b64c",
  pieceStyle: "classic",
  sounds: true
};

const boardThemes: Record<CustomizationSettings["boardTheme"], { dark: string; label: string; light: string; premium: boolean }> = {
  blue: { dark: "#4f6f9f", label: "Синяя", light: "#dbeafe", premium: false },
  green: { dark: "#769656", label: "Зелёная", light: "#eeeed2", premium: false },
  marble: { dark: "#64748b", label: "Мрамор", light: "#f8fafc", premium: true },
  wood: { dark: "#9a6735", label: "Дерево", light: "#f0d9b5", premium: false }
};

const pieceStyles: Record<CustomizationSettings["pieceStyle"], { label: string; premium: boolean }> = {
  classic: { label: "Классик", premium: false },
  neon: { label: "Неон", premium: false },
  pixel: { label: "Пиксель", premium: false },
  premium: { label: "Premium", premium: true }
};

const pieceStylePreviewPiece: Piece = { color: "white", type: "king" };
const customizationPreviewPieces: Array<Piece | null> = [
  { color: "black", type: "rook" },
  null,
  { color: "black", type: "king" },
  null,
  { color: "white", type: "pawn" },
  null,
  null,
  { color: "white", type: "king" }
];

const pieceNotation: Record<PieceType, string> = {
  bishop: "B",
  king: "K",
  knight: "N",
  pawn: "",
  queen: "Q",
  rook: "R"
};

const pieceName: Record<PieceType, string> = {
  bishop: "Bishop",
  king: "King",
  knight: "Knight",
  pawn: "Pawn",
  queen: "Queen",
  rook: "Rook"
};

export function LocalGame({ mode = "local" }: { mode?: RouteMode }) {
  const router = useRouter();
  const { accessToken, updateUser, user } = useAuth();
  const initialMode = normalizeMode(mode);
  const [activeMode, setActiveMode] = useState<GameMode>(initialMode);
  const [gameStarted, setGameStarted] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("intermediate");
  const [playerColor, setPlayerColor] = useState<Color>("white");
  const [onlineTimeControl, setOnlineTimeControl] = useState<TimeControl>("3+2");
  const [onlineRating, setOnlineRating] = useState(1200);
  const [isSearching, setIsSearching] = useState(false);
  const [playerOneName, setPlayerOneName] = useState("Алексей");
  const [playerTwoName, setPlayerTwoName] = useState("Иван");
  const [localTimeControl, setLocalTimeControl] = useState<LocalTimeControl>("unlimited");
  const [flipLocalBoard, setFlipLocalBoard] = useState(true);
  const isBotGame = activeMode === "bot" && gameStarted;
  const aiColor = aiColorByPlayerColor[playerColor];
  const { error: _stockfishError, getMove, isReady: _isStockfishReady } = useStockfish(isBotGame);
  const [state, setState] = useState<BoardState>(() => parseFEN(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [_capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [hoverMove, setHoverMove] = useState<LastMove | null>(null);
  const [viewedPly, setViewedPly] = useState<number | null>(null);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [customization, setCustomization] = useState<CustomizationSettings>(defaultCustomization);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisPly, setAnalysisPly] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [copyPgnStatus, setCopyPgnStatus] = useState<string | null>(null);
  const [playerClocks, setPlayerClocks] = useState<Record<Color, number>>({ black: 0, white: 0 });
  const clockBaseRef = useRef<Record<Color, number>>({ black: 0, white: 0 });
  const turnStartedAtRef = useRef(Date.now());
  const gameVersionRef = useRef(0);
  const botRequestRef = useRef(0);
  const savedGameKeyRef = useRef<string | null>(null);

  const legalMoves = useMemo(
    () => (selectedSquare && viewedPly === null ? getLegalMoves(state, selectedSquare) : []),
    [selectedSquare, state, viewedPly]
  );
  const moveRows = useMemo(() => toMoveRows(moveHistory), [moveHistory]);
  const displayedState = useMemo(() => getDisplayedState(moveHistory, viewedPly, state), [moveHistory, state, viewedPly]);
  const displayedLastMove = hoverMove ?? getDisplayedLastMove(moveHistory, viewedPly, lastMove);
  const canUseBoard = gameStarted && viewedPly === null && !result && !isAiThinking && (!isBotGame || state.turn !== aiColor);
  const orientation = getBoardOrientation(activeMode, playerColor, flipLocalBoard, state.turn);
  const playerNames = getPlayerNames(activeMode, playerColor, playerOneName, playerTwoName);
  const currentPly = viewedPly ?? moveHistory.length;
  const isPremium = user?.plan === "pro";
  const boardThemeStyle = getBoardThemeStyle(customization);
  const gameDuration = playerClocks.white + playerClocks.black;

  const resetPosition = useCallback(() => {
    gameVersionRef.current += 1;
    botRequestRef.current += 1;
    clockBaseRef.current = { black: 0, white: 0 };
    turnStartedAtRef.current = Date.now();
    setState(parseFEN(initialFen));
    setSelectedSquare(null);
    setMoveHistory([]);
    setCapturedPieces([]);
    setLastMove(null);
    setHoverMove(null);
    setViewedPly(null);
    setResult(null);
    setIsAiThinking(false);
    setCopyPgnStatus(null);
    savedGameKeyRef.current = null;
    setPlayerClocks({ black: 0, white: 0 });
  }, []);

  const startGame = (nextMode: GameMode) => {
    setActiveMode(nextMode);
    setIsSearching(false);
    resetPosition();
    setGameStarted(nextMode !== "online");
  };

  const resetGame = () => {
    resetPosition();
    setGameStarted(activeMode !== "online");
  };

  const commitMove = useCallback(
    (
      currentState: BoardState,
      from: Square,
      to: Square,
      promotion: "queen" | "rook" | "bishop" | "knight" = "queen"
    ): BoardState | null => {
      const movingPiece = currentState.squares[from];

      if (!movingPiece) {
        setSelectedSquare(null);
        return null;
      }

      const capturedPiece = findCapturedPiece(currentState, from, to);
      const isEnPassant = movingPiece.type === "pawn" && currentState.enPassant === to && from[0] !== to[0];
      const nextState = applyMove(currentState, from, to, promotion);
      const nextStatus = getGameStatus(nextState);
      const notation = formatMove(
        currentState,
        nextState,
        movingPiece,
        from,
        to,
        Boolean(capturedPiece),
        isEnPassant,
        promotion,
        nextStatus
      );
      const durationSeconds = finishTurnClock(movingPiece.color, clockBaseRef, turnStartedAtRef, setPlayerClocks);

      setState(nextState);
      setMoveHistory((history) => [
        ...history,
        {
          color: movingPiece.color,
          durationSeconds,
          fen: toFEN(nextState),
          from,
          moveNumber: currentState.fullmoveNumber,
          notation,
          ply: history.length + 1,
          to
        }
      ]);

      if (capturedPiece) {
        setCapturedPieces((pieces) => [
          ...pieces,
          {
            capturedBy: movingPiece.color,
            piece: capturedPiece
          }
        ]);
      }

      setLastMove({ from, to });
      setSelectedSquare(null);
      setViewedPly(null);

      if (nextStatus === "checkmate") {
        setResult({
          title: `${colorLabel(movingPiece.color)} победили!`,
          subtitle: "Победа матом",
          winner: movingPiece.color
        });
      } else if (nextStatus === "stalemate") {
        setResult({
          title: "Ничья",
          subtitle: "Пат",
          winner: "draw"
        });
      } else if (nextStatus === "draw") {
        setResult({
          title: "Ничья",
          subtitle: "Партия завершена",
          winner: "draw"
        });
      }

      return nextState;
    },
    []
  );

  const requestAiMove = useCallback(
    async (currentState: BoardState, gameVersion: number, requestId: number, depth: number) => {
      setIsAiThinking(true);

      try {
        await sleep(randomBotDelay());

        if (gameVersionRef.current !== gameVersion || botRequestRef.current !== requestId) {
          return;
        }

        const bestMove = await getMove(toFEN(currentState), depth);

        if (gameVersionRef.current !== gameVersion || botRequestRef.current !== requestId) {
          return;
        }

        const parsedMove = parseUciMove(bestMove);

        if (!parsedMove) {
          throw new Error("Stockfish returned an invalid move");
        }

        const legalAiMoves = getLegalMoves(currentState, parsedMove.from);

        if (!legalAiMoves.includes(parsedMove.to)) {
          throw new Error("Stockfish returned an illegal move");
        }

        commitMove(currentState, parsedMove.from, parsedMove.to, parsedMove.promotion);
      } catch (error) {
        if (gameVersionRef.current === gameVersion && botRequestRef.current === requestId) {
          setResult({
            title: "Партия остановлена",
            subtitle: error instanceof Error ? error.message : "Stockfish move failed",
            winner: null
          });
        }
      } finally {
        if (gameVersionRef.current === gameVersion && botRequestRef.current === requestId) {
          setIsAiThinking(false);
        }
      }
    },
    [commitMove, getMove]
  );

  useEffect(() => {
    if (!gameStarted || result || viewedPly !== null) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartedAtRef.current) / 1000);

      setPlayerClocks({
        ...clockBaseRef.current,
        [state.turn]: clockBaseRef.current[state.turn] + elapsed
      });
    }, 500);

    return () => window.clearInterval(interval);
  }, [gameStarted, result, state.turn, viewedPly]);

  useEffect(() => {
    if (!isBotGame || result || viewedPly !== null || state.turn !== aiColor || isAiThinking) {
      return;
    }

    const requestId = botRequestRef.current + 1;

    botRequestRef.current = requestId;
    void requestAiMove(state, gameVersionRef.current, requestId, botDepthByDifficulty[botDifficulty]);
  }, [aiColor, botDifficulty, isAiThinking, isBotGame, requestAiMove, result, state, viewedPly]);

  useEffect(() => {
    if (!accessToken || activeMode !== "bot" || !result || result.winner === null || moveHistory.length === 0) {
      return;
    }

    const pgn = createPgn(moveRows);
    const winner = result.winner;
    const gameKey = `${activeMode}:${playerColor}:${winner}:${moveHistory.length}:${pgn}`;

    if (!pgn || savedGameKeyRef.current === gameKey) {
      return;
    }

    savedGameKeyRef.current = gameKey;

    async function saveFinishedGame() {
      try {
        const response = await fetch("/api/games", {
          body: JSON.stringify({
            opponent: "ai",
            pgn,
            ratedPlayerColor: playerColor,
            result: winner
          }),
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          method: "POST"
        });
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;

        if (!response.ok) {
          throw new Error(payload?.message ?? "Не удалось сохранить партию");
        }

        const userResponse = await fetch("/api/users/me", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (userResponse.ok) {
          updateUser((await userResponse.json()) as AuthUser);
        }
      } catch {
        savedGameKeyRef.current = null;
      }
    }

    void saveFinishedGame();
  }, [accessToken, activeMode, moveHistory.length, moveRows, playerColor, result, updateUser]);

  useEffect(() => {
    setCustomization(readCustomization());
  }, []);

  useEffect(() => {
    if (user?.preferences) {
      setCustomization(toCustomizationSettings(user.preferences));
    }
  }, [user?.preferences]);

  useEffect(() => {
    const openCustomization = () => setShowCustomization(true);

    window.addEventListener("open-chess-customization", openCustomization);

    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("customize") === "1") {
      setShowCustomization(true);
    }

    return () => {
      window.removeEventListener("open-chess-customization", openCustomization);
    };
  }, []);

  const handleSquareClick = (square: Square) => {
    if (!canUseBoard) {
      return;
    }

    if (selectedSquare && legalMoves.includes(square)) {
      commitMove(state, selectedSquare, square);
      return;
    }

    const piece = state.squares[square];

    setSelectedSquare(piece?.color === state.turn ? square : null);
  };

  const handleCopyPgn = async () => {
    const pgn = createPgn(moveRows);

    if (!pgn) {
      setCopyPgnStatus("PGN пустой.");
      return;
    }

    try {
      await copyTextToClipboard(pgn);
      setCopyPgnStatus("PGN скопирован.");
    } catch {
      setCopyPgnStatus("Не удалось скопировать PGN.");
    }
  };

  const handleAnalyzeGame = async () => {
    const pgn = createPgn(moveRows);

    if (!pgn) {
      setAnalysisError("Нет ходов для анализа");
      setIsAnalysisOpen(true);
      return;
    }

    setIsAnalysisOpen(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisPly(Math.max(0, moveHistory.length - 1));

    try {
      const response = await fetch("/api/analyze", {
        body: JSON.stringify({ depth: 18, pgn }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as AnalysisResult | { message?: string } | null;

      if (!response.ok || !isAnalysisResult(payload)) {
        throw new Error(getResponseMessage(payload) ?? "Не удалось выполнить анализ");
      }

      setAnalysisResult(payload);
      setAnalysisPly(Math.max(0, Math.min(payload.moves.length, moveHistory.length) - 1));
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Не удалось выполнить анализ");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubscribe = async () => {
    if (!accessToken) {
      setSubscriptionStatus("Войдите в аккаунт, чтобы оформить Premium.");
      return;
    }

    setSubscriptionStatus("Создаём Stripe Checkout...");

    try {
      const response = await fetch("/api/payments/checkout", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as { url?: string; message?: string } | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.message ?? "Не удалось создать checkout-сессию");
      }

      window.location.href = payload.url;
    } catch (error) {
      setSubscriptionStatus(error instanceof Error ? error.message : "Не удалось открыть Stripe Checkout");
    }
  };

  const handleSaveCustomization = async (nextSettings: CustomizationSettings) => {
    persistCustomization(nextSettings);
    setCustomization(nextSettings);
    setShowCustomization(false);

    if (!accessToken) {
      return;
    }

    await fetch("/api/users/preferences", {
      body: JSON.stringify(nextSettings),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      method: "PATCH"
    }).catch(() => undefined);
  };

  return (
    <main
      className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)] px-4 py-5 text-[var(--color-text-primary)] md:px-6"
      style={boardThemeStyle}
    >
      <div className={`flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center ${gameStarted ? "lg:gap-8" : ""}`}>
        <section className={`board-container ${gameStarted ? "w-full max-w-[700px]" : "w-full max-w-[520px]"}`}>
          <div className={`flex w-full flex-col gap-3 ${gameStarted ? "max-w-[700px] mx-auto" : "max-w-[520px] mx-auto"}`}>
            {gameStarted ? (
              <>
                <PlayerInfo
                  active={state.turn === "black" && viewedPly === null}
                  color="black"
                  name={playerNames.black}
                  time={playerClocks.black}
                />
                <TurnBanner isViewingHistory={viewedPly !== null} turn={displayedState.turn} />
                <ChessBoard
                  className={`mx-auto ${gameStarted ? "max-w-[700px]" : "max-w-[min(100vw_-_32px,520px)]"}`}
                  lastMove={displayedLastMove}
                  legalMoves={viewedPly === null ? legalMoves : []}
                  onSquareClick={handleSquareClick}
                  orientation={orientation}
                  pieceStyle={customization.pieceStyle}
                  selectedSquare={viewedPly === null ? selectedSquare : null}
                  state={displayedState}
                />
                <PlayerInfo
                  active={state.turn === "white" && viewedPly === null}
                  color="white"
                  name={playerNames.white}
                  time={playerClocks.white}
                />
              </>
            ) : (
              <ModeSetup
                activeMode={activeMode}
                botDifficulty={botDifficulty}
                flipLocalBoard={flipLocalBoard}
                isSearching={isSearching}
                localTimeControl={localTimeControl}
                onlineRating={onlineRating}
                onlineTimeControl={onlineTimeControl}
                playerColor={playerColor}
                playerOneName={playerOneName}
                playerTwoName={playerTwoName}
                setActiveMode={setActiveMode}
                setBotDifficulty={setBotDifficulty}
                setFlipLocalBoard={setFlipLocalBoard}
                setIsSearching={setIsSearching}
                setLocalTimeControl={setLocalTimeControl}
                setOnlineRating={setOnlineRating}
                setOnlineTimeControl={setOnlineTimeControl}
                setPlayerColor={setPlayerColor}
                setPlayerOneName={setPlayerOneName}
                setPlayerTwoName={setPlayerTwoName}
                startGame={startGame}
              />
            )}
          </div>
        </section>

        {gameStarted && (
          <aside className={showMobileSidebar ? "flex w-full flex-col gap-4 lg:hidden" : "hidden lg:flex lg:flex-col lg:gap-4 lg:w-[320px]"}>
            <MoveHistory
              currentPly={currentPly}
              onCopyPgn={handleCopyPgn}
              onHoverMove={setHoverMove}
              onNavigate={(ply) => setViewedPly(ply === moveHistory.length ? null : ply)}
              rows={moveRows}
              totalPly={moveHistory.length}
            />

            <Card className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Button disabled={isAiThinking} onClick={() => setResult(createResignationResult(state.turn))} variant="ghost">
                  Сдаться
                </Button>
                <Button disabled={isAiThinking} onClick={() => setResult({ title: "Ничья", subtitle: "Предложена ничья", winner: "draw" })} variant="ghost">
                  Ничья
                </Button>
              </div>
              <Button disabled={isAiThinking} onClick={resetGame}>
                Новая партия
              </Button>
            </Card>
          </aside>
        )}

        <div className="lg:hidden">
          <Button className="min-h-11 w-full" onClick={() => setShowMobileSidebar((visible) => !visible)} variant="ghost">
            {showMobileSidebar ? "Скрыть панель" : "Панель"}
          </Button>
        </div>
      </div>

      <ResultModal
        duration={gameDuration}
        isAnalyzing={isAnalyzing}
        isPremium={isPremium}
        moveCount={moveHistory.length}
        onAnalyze={() => void handleAnalyzeGame()}
        onClose={() => setResult(null)}
        onCopyPgn={handleCopyPgn}
        onMenu={() => {
          setResult(null);
          setGameStarted(false);
          router.push("/game/local");
        }}
        onNewGame={resetGame}
        open={Boolean(result)}
        pgnStatus={copyPgnStatus}
        result={result}
        whiteAccuracy={analysisResult?.accuracy.white}
        blackAccuracy={analysisResult?.accuracy.black}
      />

      <AnalysisModal
        analysis={analysisResult}
        currentPly={analysisPly}
        error={analysisError}
        history={moveHistory}
        isLoading={isAnalyzing}
        isPremium={isPremium}
        onClose={() => setIsAnalysisOpen(false)}
        onNavigate={setAnalysisPly}
        open={isAnalysisOpen}
      />

      <CustomizationModal
        isPremium={isPremium}
        onClose={() => setShowCustomization(false)}
        onSave={(nextSettings) => void handleSaveCustomization(nextSettings)}
        open={showCustomization}
        settings={customization}
      />

      <SubscriptionModal
        onClose={() => setShowSubscription(false)}
        onSubscribe={() => void handleSubscribe()}
        open={showSubscription}
        status={subscriptionStatus}
      />
    </main>
  );
}

function ModeSetup({
  activeMode,
  botDifficulty,
  flipLocalBoard,
  isSearching,
  localTimeControl,
  onlineRating,
  onlineTimeControl,
  playerColor,
  playerOneName,
  playerTwoName,
  setActiveMode,
  setBotDifficulty,
  setFlipLocalBoard,
  setIsSearching,
  setLocalTimeControl,
  setOnlineRating,
  setOnlineTimeControl,
  setPlayerColor,
  setPlayerOneName,
  setPlayerTwoName,
  startGame
}: {
  activeMode: GameMode;
  botDifficulty: BotDifficulty;
  flipLocalBoard: boolean;
  isSearching: boolean;
  localTimeControl: LocalTimeControl;
  onlineRating: number;
  onlineTimeControl: TimeControl;
  playerColor: Color;
  playerOneName: string;
  playerTwoName: string;
  setActiveMode: (mode: GameMode) => void;
  setBotDifficulty: (value: BotDifficulty) => void;
  setFlipLocalBoard: (value: boolean) => void;
  setIsSearching: (value: boolean) => void;
  setLocalTimeControl: (value: LocalTimeControl) => void;
  setOnlineRating: (value: number) => void;
  setOnlineTimeControl: (value: TimeControl) => void;
  setPlayerColor: (value: Color) => void;
  setPlayerOneName: (value: string) => void;
  setPlayerTwoName: (value: string) => void;
  startGame: (mode: GameMode) => void;
}) {
  return (
    <Card className="mx-auto flex w-full max-w-[520px] flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        <ModeTab active={activeMode === "bot"} label="Бот" onClick={() => setActiveMode("bot")} />
        <ModeTab active={activeMode === "online"} label="Онлайн" onClick={() => setActiveMode("online")} />
        <ModeTab active={activeMode === "local"} label="1 на 1" onClick={() => setActiveMode("local")} />
      </div>

      {activeMode === "bot" ? (
        <section className="flex flex-col gap-5">
          <div>
            <h1 className="text-[24px] font-semibold leading-tight">🤖 Играть с ботом</h1>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">Выбери сложность и цвет фигур.</p>
          </div>
          <SegmentedGrid
            label="Сложность"
            options={difficultyLabels}
            value={botDifficulty}
            onChange={setBotDifficulty}
          />
          <SegmentedGrid
            label="Цвет фигур"
            options={[
              { label: "Белые ●", value: "white" as const },
              { label: "Чёрные ○", value: "black" as const }
            ]}
            value={playerColor}
            onChange={setPlayerColor}
          />
          <Button className="min-h-11" onClick={() => startGame("bot")}>Начать игру</Button>
        </section>
      ) : null}

      {activeMode === "online" ? (
        <section className="flex flex-col gap-5">
          <div>
            <h1 className="text-[24px] font-semibold leading-tight">⚡ Играть онлайн</h1>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">Матчмейкинг по рейтингу ELO и контроль времени.</p>
          </div>
          <SegmentedGrid
            label="Контроль времени"
            options={timeControls}
            value={onlineTimeControl}
            onChange={setOnlineTimeControl}
          />
          <label className="flex flex-col gap-2 text-[14px] text-[var(--color-text-secondary)]">
            Рейтинг: {onlineRating} ±
            <input
              className="h-10 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[var(--color-text-primary)]"
              max={2800}
              min={400}
              onChange={(event) => setOnlineRating(Number(event.target.value))}
              step={50}
              type="number"
              value={onlineRating}
            />
          </label>
          <Button className="min-h-11" onClick={() => setIsSearching(!isSearching)}>
            {isSearching ? "Отменить поиск" : "Найти соперника"}
          </Button>
          {isSearching ? (
            <div className="flex items-center gap-3 rounded-[6px] border border-[var(--color-border)] p-3 text-[14px] text-[var(--color-text-secondary)]">
              <span className="h-3 w-3 animate-ping rounded-full bg-[var(--color-accent)]" />
              Поиск соперника через WebSocket matchmaking...
            </div>
          ) : null}
        </section>
      ) : null}

      {activeMode === "local" ? (
        <section className="flex flex-col gap-5">
          <div>
            <h1 className="text-[24px] font-semibold leading-tight">🤝 Один на один</h1>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">Два игрока на одном устройстве.</p>
          </div>
          <NameInput label="Имя игрока 1" onChange={setPlayerOneName} value={playerOneName} />
          <NameInput label="Имя игрока 2" onChange={setPlayerTwoName} value={playerTwoName} />
          <label className="flex flex-col gap-2 text-[14px] text-[var(--color-text-secondary)]">
            Контроль времени
            <select
              className="h-10 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[var(--color-text-primary)]"
              onChange={(event) => setLocalTimeControl(event.target.value as LocalTimeControl)}
              value={localTimeControl}
            >
              {localTimeControls.map((control) => (
                <option key={control.value} value={control.value}>{control.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]">
            <input checked={flipLocalBoard} onChange={(event) => setFlipLocalBoard(event.target.checked)} type="checkbox" />
            Разворачивать доску после каждого хода
          </label>
          <Button className="min-h-11" onClick={() => startGame("local")}>Начать игру</Button>
        </section>
      ) : null}
    </Card>
  );
}

function ModeTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`h-10 rounded-[6px] border px-3 text-[14px] transition-colors ${
        active
          ? "border-[var(--color-accent)] bg-[rgba(129,182,76,0.16)] text-[var(--color-text-primary)]"
          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SegmentedGrid<T extends string>({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[14px] text-[var(--color-text-secondary)]">{label}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            className={`min-h-10 rounded-[6px] border px-3 text-[14px] transition-colors ${
              option.value === value
                ? "border-[var(--color-accent)] bg-[rgba(129,182,76,0.16)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function NameInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="flex flex-col gap-2 text-[14px] text-[var(--color-text-secondary)]">
      {label}
      <input
        className="h-10 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[var(--color-text-primary)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function PlayerInfo({ active, color, name, time }: { active: boolean; color: Color; name: string; time: number }) {
  return (
    <div
      className={`flex min-h-[56px] items-center justify-between gap-3 rounded-[8px] border-2 bg-[var(--color-surface)] px-4 transition-all duration-300 ${
        active
          ? "border-[var(--color-accent)] shadow-[0_0_0_3px_rgba(129,182,76,0.16)]"
          : "border-transparent opacity-70"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[18px] transition-opacity duration-300 ${active ? "opacity-100" : "opacity-50"}`}>
          {color === "white" ? "♙" : "♟"}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {active ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-accent)]" /> : null}
            <span className="truncate text-[15px] font-medium">{name}</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-secondary)]">{colorLabel(color)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 font-mono text-[15px]">
        <span>{formatClock(time)}</span>
        <span className={`h-2 w-12 rounded-full ${active ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />
      </div>
    </div>
  );
}

function TurnBanner({ isViewingHistory, turn }: { isViewingHistory: boolean; turn: Color }) {
  return (
    <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center transition-colors duration-300">
      <span className="text-[18px] font-semibold text-[var(--color-accent)]">
        {isViewingHistory ? "Просмотр позиции" : turn === "white" ? "♙ Ход белых" : "♟ Ход чёрных"}
      </span>
    </div>
  );
}

function ResultModal({
  blackAccuracy,
  duration,
  isAnalyzing,
  isPremium,
  moveCount,
  onAnalyze,
  onClose,
  onCopyPgn,
  onMenu,
  onNewGame,
  open,
  pgnStatus,
  result,
  whiteAccuracy
}: {
  blackAccuracy?: number;
  duration: number;
  isAnalyzing: boolean;
  isPremium: boolean;
  moveCount: number;
  onAnalyze: () => void;
  onClose: () => void;
  onCopyPgn: () => void;
  onMenu: () => void;
  onNewGame: () => void;
  open: boolean;
  pgnStatus: string | null;
  result: ResultInfo | null;
  whiteAccuracy?: number;
}) {
  if (!result) {
    return null;
  }

  return (
    <Modal className="max-w-[620px] p-0" onClose={onClose} open={open}>
      <div className="border-b border-[var(--color-border)] px-6 pb-5">
        <h2 className="text-[24px] font-semibold leading-tight">👑 {result.title}</h2>
        <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">{result.subtitle}</p>
      </div>
      <div className="grid gap-5 px-6 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ResultSideCard active={result.winner === "black"} color="black" label={result.winner === "black" ? "Победа" : "Поражение"} />
          <span className="text-[13px] text-[var(--color-text-secondary)]">vs</span>
          <ResultSideCard active={result.winner === "white"} color="white" label={result.winner === "white" ? "Победа" : "Поражение"} />
        </div>

        <div className="grid gap-2 text-[14px]">
          <ResultStat label="Ходов сыграно" value={String(moveCount)} />
          <ResultStat label="Время партии" value={formatClock(duration)} />
          <ResultStat label="Точность белых" value={formatAccuracy(whiteAccuracy)} />
          <ResultStat label="Точность чёрных" value={isPremium ? formatAccuracy(blackAccuracy) : "🔒 Premium"} />
        </div>
      </div>
      <div className="grid gap-3 border-t border-[var(--color-border)] px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          <Button disabled={isAnalyzing || moveCount === 0} onClick={onAnalyze} variant="ghost">
            {isAnalyzing ? "Анализ..." : "🔍 Анализ партии"}
          </Button>
          <Button disabled={moveCount === 0} onClick={onCopyPgn} variant="ghost">
            📋 PGN
          </Button>
        </div>
        {pgnStatus ? <p className="text-center text-[13px] text-[var(--color-text-secondary)]">{pgnStatus}</p> : null}
        <Button onClick={onNewGame}>Новая партия</Button>
        <Button onClick={onMenu} variant="ghost">Вернуться в меню</Button>
      </div>
    </Modal>
  );
}

function ResultSideCard({ active, color, label }: { active: boolean; color: Color; label: string }) {
  return (
    <div className={`rounded-[8px] border p-4 text-center ${active ? "border-[var(--color-accent)] bg-[rgba(129,182,76,0.14)]" : "border-[var(--color-border)]"}`}>
      <div className="text-[14px] font-medium">{colorLabel(color)}</div>
      <div className="my-3 font-mono text-[24px]">{active ? "████" : "░░░░"}</div>
      <div className={active ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}>{label}</div>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4">
      <span className="text-[var(--color-text-secondary)]">{label}:</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function AnalysisModal({
  analysis,
  currentPly,
  error,
  history,
  isLoading,
  isPremium,
  onClose,
  onNavigate,
  open
}: {
  analysis: AnalysisResult | null;
  currentPly: number;
  error: string | null;
  history: MoveRecord[];
  isLoading: boolean;
  isPremium: boolean;
  onClose: () => void;
  onNavigate: (ply: number) => void;
  open: boolean;
}) {
  const safePly = Math.max(0, Math.min(currentPly, Math.max(0, history.length - 1)));
  const state = history[safePly] ? parseFEN(history[safePly].fen) : parseFEN(initialFen);
  const lastMoveForPly = history[safePly] ? { from: history[safePly].from, to: history[safePly].to } : null;

  return (
    <Modal className="max-h-[calc(100vh-48px)] max-w-[860px] overflow-y-auto p-5" onClose={onClose} open={open} title="🔍 Анализ партии">
      {isLoading ? (
        <div className="flex min-h-[360px] items-center justify-center text-[15px] text-[var(--color-text-secondary)]">
          Stockfish анализирует партию...
        </div>
      ) : error ? (
        <div className="rounded-[8px] border border-[var(--color-border)] p-4 text-[14px] text-[var(--color-text-secondary)]">{error}</div>
      ) : analysis ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
          <section className="flex flex-col gap-3">
            <ChessBoard
              className="max-w-[340px]"
              lastMove={lastMoveForPly}
              legalMoves={[]}
              onSquareClick={() => undefined}
              orientation="white"
              selectedSquare={null}
              state={state}
            />
            <div className="flex items-center justify-between gap-3 text-[14px]">
              <Button disabled={safePly === 0} onClick={() => onNavigate(Math.max(0, safePly - 1))} variant="ghost">←</Button>
              <span>Ход {Math.min(safePly + 1, history.length)}/{history.length}</span>
              <Button disabled={safePly >= history.length - 1} onClick={() => onNavigate(Math.min(history.length - 1, safePly + 1))} variant="ghost">→</Button>
            </div>
            <AnalysisMoveList analysis={analysis} currentPly={safePly} onNavigate={onNavigate} />
          </section>
          <section className="flex flex-col gap-3">
            <EvaluationChart moves={analysis.moves} />
            <div className="grid gap-2 rounded-[8px] border border-[var(--color-border)] p-3">
              <h3 className="text-[15px] font-medium">Точность</h3>
              <AccuracyLine label="Белые" value={analysis.accuracy.white} />
              {isPremium ? (
                <AccuracyLine label="Чёрные" value={analysis.accuracy.black} />
              ) : (
                <PremiumGate feature="Точность чёрных" />
              )}
            </div>
            <div className="grid gap-2 rounded-[8px] border border-[var(--color-border)] p-3 text-[14px]">
              <h3 className="text-[15px] font-medium">Итог</h3>
              <ResultStat label="Зевки Б / Ч" value={`${analysis.summary.blunders.white} / ${analysis.summary.blunders.black}`} />
              <ResultStat label="Ошибки Б / Ч" value={`${analysis.summary.mistakes.white} / ${analysis.summary.mistakes.black}`} />
              <ResultStat label="Неточн. Б / Ч" value={`${analysis.summary.inaccuracies.white} / ${analysis.summary.inaccuracies.black}`} />
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-[8px] border border-[var(--color-border)] p-4 text-[14px] text-[var(--color-text-secondary)]">
          Запустите анализ после завершения партии.
        </div>
      )}
    </Modal>
  );
}

function AnalysisMoveList({
  analysis,
  currentPly,
  onNavigate
}: {
  analysis: AnalysisResult;
  currentPly: number;
  onNavigate: (ply: number) => void;
}) {
  return (
    <div className="max-h-[160px] overflow-y-auto rounded-[8px] border border-[var(--color-border)]">
      <table className="w-full border-collapse font-mono text-[13px]">
        <tbody>
          {analysis.moves.map((move, index) => (
            <tr key={`${move.moveNumber}-${move.color}`}>
              <td className="w-10 px-2 py-2 text-[var(--color-text-secondary)]">{move.color === "white" ? `${move.moveNumber}.` : ""}</td>
              <td className="px-2 py-1">
                <button
                  className={`flex w-full items-center justify-between rounded-[5px] px-2 py-1 text-left ${currentPly === index ? "bg-[rgba(129,182,76,0.16)]" : ""}`}
                  onClick={() => onNavigate(index)}
                  type="button"
                >
                  <span>{move.san}</span>
                  <span style={{ color: classificationColor(move.classification) }}>{classificationIcon(move.classification)}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EvaluationChart({ moves }: { moves: AnalysisMove[] }) {
  const points = moves.map((move, index) => {
    const x = moves.length <= 1 ? 0 : (index / (moves.length - 1)) * 100;
    const clampedEval = Math.max(-4, Math.min(4, move.eval));
    const y = 50 - (clampedEval / 8) * 80;

    return `${x},${Math.max(8, Math.min(92, y))}`;
  });

  return (
    <div className="rounded-[8px] border border-[var(--color-border)] p-3">
      <h3 className="mb-3 text-[15px] font-medium">График оценки позиции</h3>
      <svg className="h-[130px] w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <line stroke="var(--color-border)" strokeWidth="1" x1="0" x2="100" y1="50" y2="50" />
        <polyline fill="none" points={points.join(" ")} stroke="var(--color-accent)" strokeWidth="2" />
      </svg>
    </div>
  );
}

function AccuracyLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[70px_1fr_48px] items-center gap-3 text-[14px]">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <span className="block h-full bg-[var(--color-accent)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </span>
      <span className="font-mono">{Math.round(value)}%</span>
    </div>
  );
}

function PremiumGate({ feature }: { feature: string }) {
  return (
    <div className="rounded-[6px] border border-[var(--color-border)] p-3 text-[13px] text-[var(--color-text-secondary)]">
      🔒 {feature}
    </div>
  );
}

function CustomizationModal({
  isPremium,
  onClose,
  onSave,
  open,
  settings
}: {
  isPremium: boolean;
  onClose: () => void;
  onSave: (settings: CustomizationSettings) => void;
  open: boolean;
  settings: CustomizationSettings;
}) {
  const [draft, setDraft] = useState(settings);
  const [activeTab, setActiveTab] = useState<"board" | "pieces" | "other">("board");

  useEffect(() => {
    setDraft(settings);
  }, [settings, open]);

  return (
    <Modal className="max-w-[420px]" onClose={onClose} open={open} showCloseButton={false} title="🎨">
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-[8px] border border-[var(--color-border)] p-1">
          {(["board", "pieces", "other"] as const).map((tab) => (
            <button
              className={`flex-1 rounded-[6px] px-3 py-2 text-[13px] transition-colors ${activeTab === tab ? "bg-[var(--color-accent)] text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab === "board" ? "Доска" : tab === "pieces" ? "Фигуры" : "Прочее"}
            </button>
          ))}
        </div>

        {activeTab === "board" && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(boardThemes).map(([value, item]) => {
                const locked = item.premium && !isPremium;
                return (
                  <button
                    className={`aspect-square rounded-[8px] border-2 ${draft.boardTheme === value ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"} ${locked ? "opacity-40" : ""}`}
                    disabled={locked}
                    key={value}
                    onClick={() => setDraft((current) => ({ ...current, boardTheme: value as CustomizationSettings["boardTheme"] }))}
                    style={{ background: item.light }}
                    title={locked ? "🔒 Premium" : item.label}
                    type="button"
                  >
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-4 w-4 rounded" style={{ background: item.dark }} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-secondary)]">Цвет подсветки</span>
              <div className="flex gap-2">
                {isPremium && (
                  <button
                    className={`h-7 w-7 rounded-full border-2 ${draft.highlightColor === "#cc3030" ? "border-[var(--color-text-primary)]" : "border-transparent"}`}
                    onClick={() => setDraft((current) => ({ ...current, highlightColor: "#cc3030" as CustomizationSettings["highlightColor"] }))}
                    style={{ background: "#cc3030" }}
                    title="🔴 Красный (Premium)"
                    type="button"
                  />
                )}
                {["#f0c040", "#3b82f6", "#81b64c"].map((color) => (
                  <button
                    className={`h-7 w-7 rounded-full border-2 ${draft.highlightColor === color ? "border-[var(--color-text-primary)]" : "border-transparent"}`}
                    key={color}
                    onClick={() => setDraft((current) => ({ ...current, highlightColor: color as CustomizationSettings["highlightColor"] }))}
                    style={{ background: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "pieces" && (
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(pieceStyles).map(([value, item]) => {
              const locked = item.premium && !isPremium;
              const styleName = value as CustomizationSettings["pieceStyle"];

              return (
                <button
                  className={`aspect-square rounded-[8px] border-2 flex flex-col items-center justify-center gap-2 bg-[var(--color-bg)] p-2 ${draft.pieceStyle === value ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"} ${locked ? "opacity-40" : ""}`}
                  disabled={locked}
                  key={value}
                  onClick={() => setDraft((current) => ({ ...current, pieceStyle: styleName }))}
                  title={locked ? "🔒 Premium" : item.label}
                  type="button"
                >
                  {locked ? (
                    <span className="text-[24px] leading-none">🔒</span>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center">
                      <ChessPieceSvg piece={pieceStylePreviewPiece} styleName={styleName} />
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--color-text-secondary)]">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "other" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-secondary)]">Анимация</span>
              <ToggleSwitch checked={draft.animations} onChange={(value) => setDraft((current) => ({ ...current, animations: value }))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-secondary)]">Звуки</span>
              <ToggleSwitch checked={draft.sounds} onChange={(value) => setDraft((current) => ({ ...current, sounds: value }))} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-[8px] border border-[var(--color-border)] p-3" style={getBoardThemeStyle(draft)}>
          <div className="grid w-14 grid-cols-4 gap-[2px] font-mono text-sm">
            {customizationPreviewPieces.map((piece, index) => (
              <div
                className="aspect-square flex items-center justify-center overflow-hidden"
                key={index}
                style={{ background: index % 2 === 0 ? "var(--color-square-light)" : "var(--color-square-dark)" }}
              >
                {piece ? <ChessPieceSvg piece={piece} styleName={draft.pieceStyle} /> : null}
              </div>
            ))}
          </div>
          <span className="text-[12px] text-[var(--color-text-secondary)]">Превью</span>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onClose} variant="ghost">
            Отмена
          </Button>
          <Button className="flex-1" onClick={() => onSave(draft)}>
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function _CustomizationGrid<T extends string>({
  isPremium,
  items,
  label,
  onSelect,
  selected
}: {
  isPremium: boolean;
  items: Array<{ label: string; premium: boolean; preview: string; value: T }>;
  label: string;
  onSelect: (value: T) => void;
  selected: T;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-[14px] text-[var(--color-text-secondary)]">{label}</legend>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => {
          const locked = item.premium && !isPremium;

          return (
            <button
              className={`min-h-[92px] rounded-[8px] border p-3 text-left transition-colors ${selected === item.value ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"} ${locked ? "opacity-55" : ""}`}
              disabled={locked}
              key={item.value}
              onClick={() => onSelect(item.value)}
              type="button"
            >
              <div className="font-mono text-[22px]">{locked ? "🔒" : item.preview}</div>
              <div className="mt-2 text-[14px]">{item.label}{selected === item.value ? " ✓" : ""}</div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function _ToggleRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <button className={`rounded-[6px] border px-3 py-2 ${checked ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"}`} onClick={() => onChange(true)} type="button">ВКЛ ●</button>
        <button className={`rounded-[6px] border px-3 py-2 ${!checked ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"}`} onClick={() => onChange(false)} type="button">ВЫКЛ ○</button>
      </div>
    </div>
  );
}

function SubscriptionModal({
  onClose,
  onSubscribe,
  open,
  status
}: {
  onClose: () => void;
  onSubscribe: () => void;
  open: boolean;
  status: string | null;
}) {
  return (
    <Modal className="max-w-[760px]" onClose={onClose} open={open} title="👑 Открой полный доступ">
      <div className="grid gap-4 md:grid-cols-2">
        <PlanCard
          cta="Текущий план"
          features={["3 игры в день", "2 темы доски", "Анализ партий недоступен", "Точность ходов недоступна", "Базовые боты"]}
          name="FREE"
          price="$0/мес"
        />
        <PlanCard
          cta="Перейти на Premium"
          features={["Неограниченные игры", "Все темы и стили", "Глубокий анализ AI", "Точность ходов", "Все уровни ботов", "Без рекламы"]}
          highlighted
          name="PREMIUM"
          onClick={onSubscribe}
          price="$9.99/мес"
        />
      </div>
      {status ? <p className="mt-4 text-[13px] text-[var(--color-text-secondary)]">{status}</p> : null}
    </Modal>
  );
}

function PlanCard({
  cta,
  features,
  highlighted = false,
  name,
  onClick,
  price
}: {
  cta: string;
  features: string[];
  highlighted?: boolean;
  name: string;
  onClick?: () => void;
  price: string;
}) {
  return (
    <div className={`rounded-[8px] border p-5 ${highlighted ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"}`}>
      <h3 className="text-[18px] font-semibold">{name}</h3>
      <p className="mt-1 font-mono text-[15px] text-[var(--color-text-secondary)]">{price}</p>
      <div className="my-4 h-px bg-[var(--color-border)]" />
      <ul className="grid gap-2 text-[14px]">
        {features.map((feature) => (
          <li key={feature}>{feature.includes("недоступ") ? "❌" : "✅"} {feature}</li>
        ))}
      </ul>
      <Button className="mt-5 w-full" disabled={!onClick} onClick={onClick} variant={highlighted ? "primary" : "ghost"}>
        {cta}
      </Button>
    </div>
  );
}

function _GameModeSelector({
  activeMode,
  gameStarted,
  onModeChange
}: {
  activeMode: GameMode;
  gameStarted: boolean;
  onModeChange: (mode: GameMode) => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-[18px] font-medium leading-[1.2]">Режимы игры</h2>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          {gameStarted ? "Смена режима откроет экран настройки." : "Выберите отдельный экран настройки."}
        </p>
      </div>
      <div className="grid gap-2">
        <ModeButton active={activeMode === "bot"} icon="🤖" label="Играть с ботом" onClick={() => onModeChange("bot")} />
        <ModeButton active={activeMode === "online"} icon="⚡" label="Играть онлайн" onClick={() => onModeChange("online")} />
        <ModeButton active={activeMode === "local"} icon="🤝" label="Один на один" onClick={() => onModeChange("local")} />
      </div>
    </Card>
  );
}

function ModeButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button
      className={`flex min-h-11 items-center gap-3 rounded-[6px] border px-3 text-left transition-colors ${
        active
          ? "border-[var(--color-accent)] bg-[rgba(129,182,76,0.16)]"
          : "border-[var(--color-border)] hover:bg-[var(--color-bg)]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span>{icon}</span>
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}

function _GameSummary({
  activeMode,
  capturedPieces,
  isAiThinking,
  isStockfishReady,
  stockfishError
}: {
  activeMode: GameMode;
  capturedPieces: CapturedPiece[];
  isAiThinking: boolean;
  isStockfishReady: boolean;
  stockfishError: string | null;
}) {
  const status = getGameSummaryStatus(activeMode, isAiThinking, isStockfishReady, stockfishError);

  return (
    <>
      <Card className="flex flex-col gap-2">
        <h2 className="text-[18px] font-medium leading-tight">{modeTitle(activeMode)}</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">{status}</p>
      </Card>
      <Card>
        <CapturedPieces pieces={capturedPieces} />
      </Card>
    </>
  );
}

function getGameSummaryStatus(
  activeMode: GameMode,
  isAiThinking: boolean,
  isStockfishReady: boolean,
  stockfishError: string | null
): string {
  if (stockfishError) {
    return stockfishError;
  }

  if (activeMode === "bot" && !isStockfishReady) {
    return "Подготовка движка...";
  }

  if (isAiThinking) {
    return "Бот думает...";
  }

  return "Партия готова к ходу.";
}

function CapturedPieces({ pieces }: { pieces: CapturedPiece[] }) {
  const whiteCaptures = pieces.filter((entry) => entry.capturedBy === "white");
  const blackCaptures = pieces.filter((entry) => entry.capturedBy === "black");

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[15px] font-medium">Взятые фигуры</h3>
      <CapturedLine label="Белые" pieces={whiteCaptures} />
      <CapturedLine label="Чёрные" pieces={blackCaptures} />
    </section>
  );
}

function CapturedLine({ label, pieces }: { label: string; pieces: CapturedPiece[] }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-right text-[var(--color-text-primary)]">
        {pieces.length > 0 ? pieces.map(({ piece }) => pieceName[piece.type]).join(", ") : "Нет"}
      </span>
    </div>
  );
}

function MoveHistory({
  currentPly,
  onCopyPgn,
  onHoverMove,
  onNavigate,
  rows,
  totalPly
}: {
  currentPly: number;
  onCopyPgn: () => void;
  onHoverMove: (move: LastMove | null) => void;
  onNavigate: (ply: number) => void;
  rows: MoveRow[];
  totalPly: number;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ behavior: "smooth", top: scrollRef.current.scrollHeight });
  }, [rows.length]);

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-[15px] font-medium">📋 История ходов</h3>
      <div ref={scrollRef} className="max-h-[330px] overflow-y-auto rounded-[6px] border border-[var(--color-border)]">
        <table className="w-full border-collapse font-mono text-[13px]">
          <thead className="sticky top-0 bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
            <tr>
              <th className="w-10 px-2 py-2 text-left font-normal">№</th>
              <th className="px-2 py-2 text-left font-normal">Белые</th>
              <th className="px-2 py-2 text-left font-normal">Чёрные</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.moveNumber}>
                  <td className="px-2 py-2 text-[var(--color-text-secondary)]">{row.moveNumber}.</td>
                  <MoveCell currentPly={currentPly} move={row.white} onHoverMove={onHoverMove} onNavigate={onNavigate} />
                  <MoveCell currentPly={currentPly} move={row.black} onHoverMove={onHoverMove} onNavigate={onNavigate} />
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-2 py-4 text-[var(--color-text-secondary)]" colSpan={3}>
                  Ходов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-[repeat(4,40px)_1fr] gap-2">
        <HistoryButton disabled={totalPly === 0 || currentPly === 0} label="⏮" onClick={() => onNavigate(0)} />
        <HistoryButton disabled={totalPly === 0 || currentPly === 0} label="◀" onClick={() => onNavigate(Math.max(0, currentPly - 1))} />
        <HistoryButton disabled={totalPly === 0 || currentPly === totalPly} label="▶" onClick={() => onNavigate(Math.min(totalPly, currentPly + 1))} />
        <HistoryButton disabled={totalPly === 0 || currentPly === totalPly} label="⏭" onClick={() => onNavigate(totalPly)} />
        <Button className="min-w-0 px-3 text-[13px]" disabled={totalPly === 0} onClick={onCopyPgn} variant="ghost">
          Скопировать PGN
        </Button>
      </div>
    </Card>
  );
}

function MoveCell({
  currentPly,
  move,
  onHoverMove,
  onNavigate
}: {
  currentPly: number;
  move: MoveRecord | null;
  onHoverMove: (move: LastMove | null) => void;
  onNavigate: (ply: number) => void;
}) {
  if (!move) {
    return <td className="px-2 py-2 text-[var(--color-text-secondary)]">—</td>;
  }

  const isCurrent = currentPly === move.ply;

  return (
    <td className="px-1 py-1">
      <button
        className={`flex w-full items-center justify-between gap-2 rounded-[5px] px-2 py-1 text-left transition-colors hover:bg-[rgba(129,182,76,0.16)] ${
          isCurrent ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"
        }`}
        onClick={() => onNavigate(move.ply)}
        onMouseEnter={() => onHoverMove({ from: move.from, to: move.to })}
        onMouseLeave={() => onHoverMove(null)}
        type="button"
      >
        <span className="truncate">{specialMoveIcon(move.notation)} {move.notation}</span>
        <span className="text-[11px] text-[var(--color-text-secondary)]">{formatMoveTime(move.durationSeconds)}</span>
      </button>
    </td>
  );
}

function HistoryButton({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: () => void }) {
  return (
    <Button className="h-10 px-0" disabled={disabled} onClick={onClick} variant="ghost">
      {label}
    </Button>
  );
}

function toMoveRows(history: MoveRecord[]): MoveRow[] {
  const rows = new Map<number, MoveRow>();

  for (const move of history) {
    const row = rows.get(move.moveNumber) ?? {
      black: null,
      moveNumber: move.moveNumber,
      white: null
    };

    if (move.color === "white") {
      row.white = move;
    } else {
      row.black = move;
    }

    rows.set(move.moveNumber, row);
  }

  return [...rows.values()];
}

function getDisplayedState(history: MoveRecord[], viewedPly: number | null, liveState: BoardState): BoardState {
  if (viewedPly === null) {
    return liveState;
  }

  if (viewedPly === 0) {
    return parseFEN(initialFen);
  }

  const move = history[viewedPly - 1];

  return move ? parseFEN(move.fen) : liveState;
}

function getDisplayedLastMove(history: MoveRecord[], viewedPly: number | null, liveLastMove: LastMove | null): LastMove | null {
  if (viewedPly === null) {
    return liveLastMove;
  }

  if (viewedPly === 0) {
    return null;
  }

  const move = history[viewedPly - 1];

  return move ? { from: move.from, to: move.to } : null;
}

function findCapturedPiece(state: BoardState, from: Square, to: Square): Piece | null {
  const movingPiece = state.squares[from];
  const targetPiece = state.squares[to];

  if (!movingPiece) {
    return null;
  }

  if (targetPiece) {
    return targetPiece;
  }

  if (movingPiece.type === "pawn" && state.enPassant === to && from[0] !== to[0]) {
    return state.squares[`${to[0]}${from[1]}` as Square];
  }

  return null;
}

function formatMove(
  currentState: BoardState,
  nextState: BoardState,
  piece: Piece,
  from: Square,
  to: Square,
  isCapture: boolean,
  isEnPassant: boolean,
  promotion: "queen" | "rook" | "bishop" | "knight" | undefined,
  status: "ongoing" | "checkmate" | "stalemate" | "draw"
): string {
  if (piece.type === "king" && Math.abs(fileIndex(from) - fileIndex(to)) === 2) {
    return `${to[0] === "g" ? "O-O" : "O-O-O"}${status === "checkmate" ? "#" : isKingCurrentlyInCheck(nextState) ? "+" : ""}`;
  }

  const capture = isCapture ? "x" : "";
  const promotionSuffix = piece.type === "pawn" && promotion && (to.endsWith("8") || to.endsWith("1"))
    ? `=${pieceNotation[promotion]}`
    : "";
  const checkSuffix = status === "checkmate" ? "#" : isKingCurrentlyInCheck(nextState) ? "+" : "";
  const enPassantSuffix = isEnPassant ? " e.p." : "";

  if (piece.type === "pawn") {
    return `${isCapture ? from[0] : ""}${capture}${to}${promotionSuffix}${checkSuffix}${enPassantSuffix}`;
  }

  return `${pieceNotation[piece.type]}${getDisambiguation(currentState, piece, from, to)}${capture}${to}${checkSuffix}`;
}

function getDisambiguation(state: BoardState, piece: Piece, from: Square, to: Square): string {
  const contenders = allSquares().filter((square) => {
    if (square === from) {
      return false;
    }

    const candidate = state.squares[square];

    return candidate?.color === piece.color && candidate.type === piece.type && getLegalMoves(state, square).includes(to);
  });

  if (contenders.length === 0) {
    return "";
  }

  const sameFile = contenders.some((square) => square[0] === from[0]);
  const sameRank = contenders.some((square) => square[1] === from[1]);

  if (!sameFile) {
    return from[0];
  }

  if (!sameRank) {
    return from[1];
  }

  return from;
}

function isKingCurrentlyInCheck(state: BoardState): boolean {
  return allSquares().some((square) => {
    const piece = state.squares[square];

    return piece?.color !== state.turn && getAttackSquares(state, square).includes(findKingSquare(state, state.turn));
  });
}

function getAttackSquares(state: BoardState, from: Square): Square[] {
  const piece = state.squares[from];

  if (!piece) {
    return [];
  }

  const originalTurn = state.turn;

  return getLegalMoves({ ...state, turn: piece.color }, from).filter(() => originalTurn !== piece.color || true);
}

function findKingSquare(state: BoardState, color: Color): Square {
  const king = allSquares().find((square) => {
    const piece = state.squares[square];

    return piece?.color === color && piece.type === "king";
  });

  if (!king) {
    throw new Error("King not found");
  }

  return king;
}

function allSquares(): Square[] {
  const squares: Square[] = [];

  for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"] as const) {
    for (const rank of ["1", "2", "3", "4", "5", "6", "7", "8"] as const) {
      squares.push(`${file}${rank}`);
    }
  }

  return squares;
}

function fileIndex(square: Square): number {
  return square.charCodeAt(0) - 97;
}

function finishTurnClock(
  color: Color,
  clockBaseRef: React.MutableRefObject<Record<Color, number>>,
  turnStartedAtRef: React.MutableRefObject<number>,
  setPlayerClocks: (value: Record<Color, number>) => void
): number {
  const durationSeconds = Math.max(0, Math.floor((Date.now() - turnStartedAtRef.current) / 1000));
  const nextClocks = {
    ...clockBaseRef.current,
    [color]: clockBaseRef.current[color] + durationSeconds
  };

  clockBaseRef.current = nextClocks;
  turnStartedAtRef.current = Date.now();
  setPlayerClocks(nextClocks);

  return durationSeconds;
}

function getBoardOrientation(activeMode: GameMode, playerColor: Color, flipLocalBoard: boolean, turn: Color): Color {
  if (activeMode === "bot") {
    return playerColor;
  }

  if (activeMode === "local" && flipLocalBoard) {
    return turn;
  }

  return "white";
}

function getPlayerNames(activeMode: GameMode, playerColor: Color, playerOneName: string, playerTwoName: string): Record<Color, string> {
  if (activeMode === "bot") {
    return {
      black: playerColor === "black" ? "Player" : "Stockfish",
      white: playerColor === "white" ? "Player" : "Stockfish"
    };
  }

  return {
    black: playerTwoName || "Игрок 2",
    white: playerOneName || "Игрок 1"
  };
}

function createPgn(rows: MoveRow[]): string {
  if (rows.length === 0) {
    return "";
  }

  return rows
    .map((row) => `${row.moveNumber}. ${row.white?.notation ?? ""}${row.black ? ` ${row.black.notation}` : ""}`.trim())
    .join(" ");
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers that expose the API but block it on insecure origins.
    }
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is unavailable");
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

function createResignationResult(resignedColor: Color): ResultInfo {
  const winner = resignedColor === "white" ? "black" : "white";

  return {
    title: `${colorLabel(winner)} победили!`,
    subtitle: `${colorLabel(resignedColor)} сдались`,
    winner
  };
}

function formatAccuracy(value: number | undefined): string {
  return typeof value === "number" ? `${Math.round(value)}%` : "—";
}

function isAnalysisResult(value: AnalysisResult | { message?: string } | null): value is AnalysisResult {
  return Boolean(value && "accuracy" in value && "moves" in value && "summary" in value);
}

function getResponseMessage(value: AnalysisResult | { message?: string } | null): string | undefined {
  return value && "message" in value ? value.message : undefined;
}

function classificationIcon(classification: MoveClassification): string {
  if (classification === "best") {
    return "✅";
  }

  if (classification === "good") {
    return "✓";
  }

  if (classification === "inaccuracy") {
    return "?";
  }

  if (classification === "mistake") {
    return "??";
  }

  return "???";
}

function classificationColor(classification: MoveClassification): string {
  if (classification === "best") {
    return "#81b64c";
  }

  if (classification === "good") {
    return "#a8d8a8";
  }

  if (classification === "inaccuracy") {
    return "#f0c040";
  }

  if (classification === "mistake") {
    return "#e07030";
  }

  return "#cc3030";
}

function getBoardThemeStyle(settings: CustomizationSettings): CSSProperties {
  const theme = boardThemes[settings.boardTheme];

  return {
    "--color-square-dark": theme.dark,
    "--color-square-light": theme.light,
    "--color-highlight": toAlpha(settings.highlightColor, 0.45)
  } as CSSProperties;
}

function readCustomization(): CustomizationSettings {
  if (typeof window === "undefined") {
    return defaultCustomization;
  }

  return {
    animations: window.localStorage.getItem("chessAnimations") !== "false",
    boardTheme: readEnum("chessBoardTheme", defaultCustomization.boardTheme, boardThemes),
    highlightColor: readHighlightColor(),
    pieceStyle: readEnum("chessPieceStyle", defaultCustomization.pieceStyle, pieceStyles),
    sounds: window.localStorage.getItem("chessSounds") !== "false"
  };
}

function toCustomizationSettings(preferences: NonNullable<AuthUser["preferences"]>): CustomizationSettings {
  return {
    animations: preferences.animations,
    boardTheme: isBoardTheme(preferences.boardTheme) ? preferences.boardTheme : defaultCustomization.boardTheme,
    highlightColor: isHighlightColor(preferences.highlightColor) ? preferences.highlightColor : defaultCustomization.highlightColor,
    pieceStyle: isPieceStyle(preferences.pieceStyle) ? preferences.pieceStyle : defaultCustomization.pieceStyle,
    sounds: preferences.sounds
  };
}

function persistCustomization(settings: CustomizationSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("chessBoardTheme", settings.boardTheme);
  window.localStorage.setItem("chessPieceStyle", settings.pieceStyle);
  window.localStorage.setItem("chessHighlightColor", settings.highlightColor);
  window.localStorage.setItem("chessAnimations", String(settings.animations));
  window.localStorage.setItem("chessSounds", String(settings.sounds));
}

function readEnum<T extends string>(key: string, fallback: T, options: Record<T, unknown>): T {
  const value = window.localStorage.getItem(key);

  return value && value in options ? (value as T) : fallback;
}

function readHighlightColor(): CustomizationSettings["highlightColor"] {
  const value = window.localStorage.getItem("chessHighlightColor");

  if (isHighlightColor(value)) {
    return value;
  }

  return defaultCustomization.highlightColor;
}

function isHighlightColor(value: string | null): value is CustomizationSettings["highlightColor"] {
  return value === "#f0c040" || value === "#3b82f6" || value === "#81b64c" || value === "#cc3030";
}

function isBoardTheme(value: string): value is CustomizationSettings["boardTheme"] {
  return value in boardThemes;
}

function isPieceStyle(value: string): value is CustomizationSettings["pieceStyle"] {
  return value in pieceStyles;
}

function toAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
}

function specialMoveIcon(notation: string): string {
  if (notation.includes("#")) {
    return "👑";
  }

  if (notation.includes("+")) {
    return "⚠️";
  }

  if (notation.startsWith("O-O")) {
    return "🏰";
  }

  if (notation.includes("e.p.")) {
    return "e.p.";
  }

  if (notation.includes("x")) {
    return "✕";
  }

  return "";
}

function normalizeMode(mode: RouteMode): GameMode {
  return mode === "ai" ? "bot" : mode;
}

function modeTitle(mode: GameMode): string {
  if (mode === "bot") {
    return "Игра с ботом";
  }

  if (mode === "online") {
    return "Онлайн";
  }

  return "Один на один";
}

function colorLabel(color: Color): string {
  return color === "white" ? "Белые" : "Чёрные";
}

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function formatMoveTime(seconds: number): string {
  return formatClock(seconds);
}

function randomBotDelay(): number {
  return 500 + Math.floor(Math.random() * 701);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseUciMove(
  move: string
): { from: Square; promotion?: "queen" | "rook" | "bishop" | "knight"; to: Square } | null {
  const from = move.slice(0, 2);
  const to = move.slice(2, 4);
  const promotion = move.slice(4, 5);

  if (!isSquare(from) || !isSquare(to)) {
    return null;
  }

  return {
    from,
    promotion: parsePromotion(promotion),
    to
  };
}

function parsePromotion(value: string): "queen" | "rook" | "bishop" | "knight" | undefined {
  if (value === "q") {
    return "queen";
  }

  if (value === "r") {
    return "rook";
  }

  if (value === "b") {
    return "bishop";
  }

  if (value === "n") {
    return "knight";
  }

  return undefined;
}

function isSquare(value: string): value is Square {
  return /^[a-h][1-8]$/.test(value);
}
