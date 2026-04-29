"use client";

import { type AuthUser } from "@/lib/auth-types";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Credentials = {
  email: string;
  password: string;
};

type RegisterCredentials = Credentials & {
  username: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (nextUser: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const token = await refreshAccessToken();

        if (!active) {
          return;
        }

        setAccessToken(token);
        setUser(await fetchCurrentUser(token));
      } catch {
        if (active) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      login: async (credentials) => {
        setIsLoading(true);

        try {
          const token = await authenticate("/api/auth/login", credentials);

          setAccessToken(token);
          setUser(await fetchCurrentUser(token));
        } finally {
          setIsLoading(false);
        }
      },
      register: async (credentials) => {
        setIsLoading(true);

        try {
          const token = await authenticate("/api/auth/register", credentials);

          setAccessToken(token);
          setUser(await fetchCurrentUser(token));
        } finally {
          setIsLoading(false);
        }
      },
      logout: async () => {
        await fetch("/api/auth/logout", {
          method: "POST"
        });
        setAccessToken(null);
        setUser(null);
        router.push("/login");
      },
      updateUser: setUser
    }),
    [accessToken, isLoading, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

async function authenticate(path: string, body: Credentials | RegisterCredentials): Promise<string> {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const payload = (await response.json().catch(() => null)) as { accessToken?: string; message?: string } | null;

  if (!response.ok || !payload?.accessToken) {
    throw new Error(payload?.message ?? "Authentication failed");
  }

  return payload.accessToken;
}

async function refreshAccessToken(): Promise<string> {
  const response = await fetch("/api/auth/refresh", {
    method: "POST"
  });
  const payload = (await response.json().catch(() => null)) as { accessToken?: string } | null;

  if (!response.ok || !payload?.accessToken) {
    throw new Error("Not authenticated");
  }

  return payload.accessToken;
}

async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch("/api/users/me", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to load user");
  }

  return response.json() as Promise<AuthUser>;
}
