"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

type PendingMove = {
  resolve: (move: string) => void;
  reject: (error: Error) => void;
};

type UseStockfishResult = {
  getMove: (fen: string, depth: number) => Promise<string>;
  isReady: boolean;
  error: string | null;
};

const engineUrl = "/stockfish/stockfish.js#/stockfish/stockfish.wasm";
const initTimeoutMs = 15_000;
const moveTimeoutMs = 60_000;

export function useStockfish(enabled = true): UseStockfishResult {
  const workerRef = useRef<Worker | null>(null);
  const initResolveRef = useRef<(() => void) | null>(null);
  const initRejectRef = useRef<((error: Error) => void) | null>(null);
  const pendingMoveRef = useRef<PendingMove | null>(null);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return undefined;
    }

    const worker = new Worker(engineUrl);
    workerRef.current = worker;
    readyPromiseRef.current = new Promise<void>((resolve, reject) => {
      initResolveRef.current = resolve;
      initRejectRef.current = reject;
    });

    initTimeoutRef.current = setTimeout(() => {
      const initError = new Error("Stockfish initialization timed out");

      setError(initError.message);
      initRejectRef.current?.(initError);
    }, initTimeoutMs);

    worker.onmessage = (event: MessageEvent<string>) => {
      const line = event.data;

      if (line === "uciok") {
        worker.postMessage("isready");
        return;
      }

      if (line === "readyok") {
        clearTimer(initTimeoutRef);
        setIsReady(true);
        setError(null);
        initResolveRef.current?.();
        return;
      }

      if (line.startsWith("bestmove ")) {
        clearTimer(moveTimeoutRef);

        const move = line.split(/\s+/)[1];
        const pendingMove = pendingMoveRef.current;

        pendingMoveRef.current = null;

        if (!move || move === "(none)") {
          pendingMove?.reject(new Error("Stockfish did not return a move"));
        } else {
          pendingMove?.resolve(move);
        }
      }
    };

    worker.onerror = () => {
      const workerError = new Error("Stockfish worker failed");

      clearTimer(initTimeoutRef);
      clearTimer(moveTimeoutRef);
      setError(workerError.message);
      initRejectRef.current?.(workerError);
      pendingMoveRef.current?.reject(workerError);
      pendingMoveRef.current = null;
    };

    worker.postMessage("uci");

    return () => {
      clearTimer(initTimeoutRef);
      clearTimer(moveTimeoutRef);
      pendingMoveRef.current?.reject(new Error("Stockfish worker stopped"));
      pendingMoveRef.current = null;
      worker.postMessage("quit");
      worker.terminate();
      workerRef.current = null;
    };
  }, [enabled]);

  const getMove = useCallback(async (fen: string, depth: number): Promise<string> => {
    const worker = workerRef.current;

    if (!worker || !readyPromiseRef.current) {
      throw new Error("Stockfish is not initialized");
    }

    if (pendingMoveRef.current) {
      throw new Error("Stockfish is already searching");
    }

    await readyPromiseRef.current;

    return new Promise<string>((resolve, reject) => {
      pendingMoveRef.current = { resolve, reject };
      moveTimeoutRef.current = setTimeout(() => {
        const moveError = new Error("Stockfish search timed out");

        pendingMoveRef.current = null;
        reject(moveError);
      }, moveTimeoutMs);

      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
    });
  }, []);

  return { getMove, isReady, error };
}

function clearTimer(timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}
