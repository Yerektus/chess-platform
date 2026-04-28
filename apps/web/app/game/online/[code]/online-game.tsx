"use client";

import {
  applyMove,
  getGameStatus,
  getLegalMoves,
  parseFEN,
  type BoardState,
  type Color,
  type Piece,
  type Square
} from "@chess-platform/chess-engine";
import { Button, Card, ChessBoard, Modal } from "@chess-platform/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

type OnlineGameProps = {
  code: string;
};

type RoomState = {
  id: string;
  code: string;
  whiteId: string;
  blackId: string | null;
  status: "waiting" | "active" | "finished";
  fen: string;
  pgn: string;
  result: "white" | "black" | "draw" | null;
  createdAt: string;
};

type LastMove = {
  from: Square;
  to: Square;
};

type PendingMove = LastMove & {
  promotion?: "queen" | "rook" | "bishop" | "knight";
};

export function OnlineGame({ code }: OnlineGameProps) {
  const { accessToken, isLoading, user } = useAuth();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [optimisticState, setOptimisticState] = useState<BoardState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting");
  const [result, setResult] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const pendingMoveRef = useRef<PendingMove | null>(null);

  const playerColor = useMemo<Color | null>(() => {
    if (!room || !user) {
      return null;
    }

    if (room.whiteId === user.id) {
      return "white";
    }

    if (room.blackId === user.id) {
      return "black";
    }

    return null;
  }, [room, user]);

  const boardState = useMemo(() => {
    if (optimisticState) {
      return optimisticState;
    }

    if (!room) {
      return null;
    }

    return parseFEN(room.fen);
  }, [optimisticState, room]);

  const legalMoves = useMemo(
    () => (boardState && selectedSquare ? getLegalMoves(boardState, selectedSquare) : []),
    [boardState, selectedSquare]
  );
  const moveRows = useMemo(() => toMoveRows(room?.pgn ?? ""), [room?.pgn]);
  const canMove =
    Boolean(boardState) &&
    Boolean(playerColor) &&
    room?.status === "active" &&
    !optimisticState &&
    boardState?.turn === playerColor;

  const updateRoom = useCallback((nextRoom: RoomState) => {
    setRoom(nextRoom);
    setOptimisticState(null);
    setSelectedSquare(null);
    setConnectionStatus(nextRoom.status === "waiting" ? "Waiting for opponent" : "Connected");

    const confirmedLastMove = parseLastMove(nextRoom.pgn);

    if (confirmedLastMove) {
      setLastMove(confirmedLastMove);
    }

    pendingMoveRef.current = null;

    if (nextRoom.status === "finished") {
      setResult(formatResult(nextRoom.result));
    }
  }, []);

  useEffect(() => {
    if (isLoading || !accessToken || !user) {
      return undefined;
    }

    let active = true;

    async function loadInitialRoom() {
      try {
        const response = await fetch(`${getApiBaseUrl()}/rooms/${code}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Room not found");
        }

        const payload = (await response.json()) as RoomState;

        if (active) {
          updateRoom(payload);
        }
      } catch (error) {
        if (active) {
          setConnectionStatus(error instanceof Error ? error.message : "Failed to load room");
        }
      }
    }

    void loadInitialRoom();

    return () => {
      active = false;
    };
  }, [accessToken, code, isLoading, updateRoom, user]);

  useEffect(() => {
    if (isLoading || !accessToken || !user) {
      return undefined;
    }

    const socket = io(`${getWsBaseUrl()}/rooms`, {
      auth: {
        authorization: `Bearer ${accessToken}`
      },
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("Connected");
      socket.emit("join", { code, userId: user.id });
    });

    socket.on("connect_error", () => {
      setConnectionStatus("Connection failed");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("Disconnected");
    });

    socket.on("exception", (payload: { message?: string }) => {
      setOptimisticState(null);
      pendingMoveRef.current = null;
      setConnectionStatus(payload.message ?? "Room error");
    });

    socket.on("room:state", (payload: RoomState) => {
      updateRoom(payload);
    });

    socket.on("room:finished", (payload: RoomState) => {
      updateRoom(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, code, isLoading, updateRoom, user]);

  const handleSquareClick = (square: Square) => {
    if (!boardState || !canMove) {
      return;
    }

    if (selectedSquare && legalMoves.includes(square)) {
      const movingPiece = boardState.squares[selectedSquare];

      if (!movingPiece) {
        setSelectedSquare(null);
        return;
      }

      const promotion = getPromotion(movingPiece, square);
      const nextState = applyMove(boardState, selectedSquare, square, promotion);
      const move = { from: selectedSquare, to: square, promotion };

      pendingMoveRef.current = move;
      setOptimisticState(nextState);
      setLastMove(move);
      setSelectedSquare(null);
      socketRef.current?.emit("move", {
        code,
        from: selectedSquare,
        to: square,
        promotion
      });

      if (getGameStatus(nextState) !== "ongoing") {
        setConnectionStatus("Waiting for server");
      }

      return;
    }

    const piece = boardState.squares[square];

    setSelectedSquare(piece?.color === playerColor && boardState.turn === playerColor ? square : null);
  };

  const resign = () => {
    socketRef.current?.emit("resign", { code, userId: user?.id });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setConnectionStatus("Link copied");
  };

  if (isLoading || !accessToken || !user) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
        <div className="mx-auto max-w-[1200px]">
          <Card>
            <p className="text-[15px] text-[var(--color-text-secondary)]">Loading game</p>
          </Card>
        </div>
      </main>
    );
  }

  if (!boardState || !room) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
        <div className="mx-auto max-w-[1200px]">
          <Card>
            <p className="text-[15px] text-[var(--color-text-secondary)]">{connectionStatus}</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex w-full max-w-[min(calc(100vw_-_48px),560px)] flex-col gap-3 self-center lg:self-start">
          <PlayerLabel color="black" active={boardState.turn === "black"} playerColor={playerColor} />
          <ChessBoard
            lastMove={lastMove}
            legalMoves={canMove ? legalMoves : []}
            onSquareClick={handleSquareClick}
            orientation={playerColor ?? "white"}
            selectedSquare={selectedSquare}
            state={boardState}
          />
          <PlayerLabel color="white" active={boardState.turn === "white"} playerColor={playerColor} />
        </section>

        <div className="lg:hidden">
          <Button className="min-h-11 w-full" onClick={() => setShowMobileSidebar((visible) => !visible)} variant="ghost">
            {showMobileSidebar ? "Close" : "Show moves"}
          </Button>
        </div>

        <aside
          className={
            showMobileSidebar
              ? "flex w-full flex-col gap-4 lg:w-[280px]"
              : "hidden w-full flex-col gap-4 lg:flex lg:w-[280px]"
          }
        >
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-[18px] font-medium leading-[1.2]">Online game</h2>
              <p className="mt-1 font-mono text-[13px] text-[var(--color-text-secondary)]">{room.code}</p>
              <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">{connectionStatus}</p>
              <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                {playerColor ? `${capitalize(playerColor)} pieces` : "Spectating"}
              </p>
            </div>

            {room.status === "waiting" ? (
              <section className="flex flex-col gap-3">
                <p className="text-[13px] text-[var(--color-text-secondary)]">
                  Share this link: {getShareLink(code)}
                </p>
                <Button onClick={copyLink} variant="ghost">
                  Copy link
                </Button>
              </section>
            ) : null}

            <MoveHistory rows={moveRows} />

            <div className="grid grid-cols-2 gap-3">
              <Button disabled={room.status === "finished" || !playerColor} onClick={resign} variant="ghost">
                Resign
              </Button>
              <Button disabled variant="ghost">
                Offer Draw
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <Modal onClose={() => setResult(null)} open={Boolean(result)} title="Game result">
        <p className="text-[15px] text-[var(--color-text-primary)]">{result}</p>
      </Modal>
    </main>
  );
}

function PlayerLabel({
  active,
  color,
  playerColor
}: {
  active: boolean;
  color: Color;
  playerColor: Color | null;
}) {
  return (
    <div className="flex h-10 items-center justify-between rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      <span className="text-[15px] font-medium">
        {capitalize(color)}
        {playerColor === color ? " (You)" : ""}
      </span>
      <span className="text-[13px] text-[var(--color-text-secondary)]">{active ? "To move" : "Waiting"}</span>
    </div>
  );
}

function MoveHistory({ rows }: { rows: Array<{ moveNumber: number; white: string; black: string }> }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[15px] font-medium">Move history</h3>
      <div className="max-h-[328px] overflow-y-auto rounded-[6px] border border-[var(--color-border)]">
        <table className="w-full border-collapse font-mono text-[13px]">
          <thead className="text-[var(--color-text-secondary)]">
            <tr>
              <th className="w-10 px-2 py-2 text-left font-normal">No.</th>
              <th className="px-2 py-2 text-left font-normal">White</th>
              <th className="px-2 py-2 text-left font-normal">Black</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.moveNumber}>
                  <td className="px-2 py-2 text-[var(--color-text-secondary)]">{row.moveNumber}</td>
                  <td className="px-2 py-2">{row.white}</td>
                  <td className="px-2 py-2">{row.black}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-2 py-4 text-[var(--color-text-secondary)]" colSpan={3}>
                  No moves
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function toMoveRows(pgn: string): Array<{ moveNumber: number; white: string; black: string }> {
  const rows: Array<{ moveNumber: number; white: string; black: string }> = [];
  const tokens = pgn.trim().split(/\s+/).filter(Boolean);
  let currentRow: { moveNumber: number; white: string; black: string } | null = null;

  for (const token of tokens) {
    if (/^\d+\.$/.test(token)) {
      currentRow = {
        moveNumber: Number(token.slice(0, -1)),
        white: "",
        black: ""
      };
      rows.push(currentRow);
      continue;
    }

    if (!currentRow) {
      continue;
    }

    if (!currentRow.white) {
      currentRow.white = token;
    } else {
      currentRow.black = token;
    }
  }

  return rows;
}

function parseLastMove(pgn: string): LastMove | null {
  const token = pgn.trim().split(/\s+/).reverse().find((entry) => /^[a-h][1-8][a-h][1-8]/.test(entry));

  if (!token) {
    return null;
  }

  return {
    from: token.slice(0, 2) as Square,
    to: token.slice(2, 4) as Square
  };
}

function getPromotion(piece: Piece, to: Square): "queen" | undefined {
  return piece.type === "pawn" && (to.endsWith("8") || to.endsWith("1")) ? "queen" : undefined;
}

function getShareLink(code: string): string {
  if (typeof window === "undefined") {
    return `/game/online/${code}`;
  }

  return `${window.location.origin}/game/online/${code}`;
}

function getWsBaseUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

function formatResult(result: RoomState["result"]): string {
  if (result === "draw") {
    return "Draw";
  }

  if (result === "white" || result === "black") {
    return `${capitalize(result)} wins`;
  }

  return "Game finished";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
