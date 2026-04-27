export type AuthUser = {
  id: string;
  username: string;
  email: string;
  elo: number;
  plan: "free" | "pro";
  city?: string;
  createdAt: string;
};

export type GameHistoryEntry = {
  id: string;
  whiteId: string;
  blackId: string | null;
  opponent: "human" | "ai";
  pgn: string;
  result: "white" | "black" | "draw" | null;
  analysis: Array<{
    move: number;
    mistake: boolean;
    suggestion: string;
  }>;
  createdAt: string;
};

export type GameHistoryResponse = {
  items: GameHistoryEntry[];
  page: number;
  limit: number;
  total: number;
};
