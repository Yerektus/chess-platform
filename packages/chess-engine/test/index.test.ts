import { describe, expect, it } from "vitest";
import { applyMove, getGameStatus, getLegalMoves, parseFEN, toFEN } from "../src/index";

describe("FEN", () => {
  it("round-trips the initial position", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    expect(toFEN(parseFEN(fen))).toBe(fen);
  });
});

describe("getLegalMoves", () => {
  it("does not allow castling through check", () => {
    const state = parseFEN("r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1");

    expect(getLegalMoves(state, "e1")).not.toContain("g1");
    expect(getLegalMoves(state, "e1")).toContain("c1");
  });

  it("includes en passant captures", () => {
    const state = parseFEN("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");

    expect(getLegalMoves(state, "e5")).toContain("d6");
  });
});

describe("applyMove", () => {
  it("applies en passant immutably", () => {
    const state = parseFEN("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
    const next = applyMove(state, "e5", "d6");

    expect(next.squares.d6).toEqual({ type: "pawn", color: "white" });
    expect(next.squares.d5).toBeNull();
    expect(state.squares.d5).toEqual({ type: "pawn", color: "black" });
  });

  it("promotes pawns", () => {
    const state = parseFEN("4k3/6P1/8/8/8/8/8/4K3 w - - 0 1");
    const next = applyMove(state, "g7", "g8", "knight");

    expect(next.squares.g8).toEqual({ type: "knight", color: "white" });
  });
});

describe("getGameStatus", () => {
  it("detects stalemate", () => {
    const state = parseFEN("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");

    expect(getGameStatus(state)).toBe("stalemate");
  });
});
