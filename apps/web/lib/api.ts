export const apiBaseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const refreshTokenCookieName = "refreshToken";

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export function refreshTokenCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export async function proxyAuthRequest(path: "/auth/login" | "/auth/register", body: unknown): Promise<Response> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const payload = (await response.json().catch(() => null)) as TokenResponse | { message?: string } | null;

  if (!response.ok || !payload || !("accessToken" in payload) || !("refreshToken" in payload)) {
    return Response.json(
      { message: payload && "message" in payload ? payload.message : "Authentication failed" },
      { status: response.status || 500 }
    );
  }

  const nextResponse = Response.json({ accessToken: payload.accessToken });

  nextResponse.headers.append(
    "Set-Cookie",
    serializeRefreshTokenCookie(payload.refreshToken, refreshTokenCookieOptions().maxAge)
  );

  return nextResponse;
}

export function serializeRefreshTokenCookie(value: string, maxAge: number): string {
  const options = refreshTokenCookieOptions();
  const cookie = [
    `${refreshTokenCookieName}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    `Path=${options.path}`,
    "HttpOnly",
    `SameSite=${options.sameSite}`
  ];

  if (options.secure) {
    cookie.push("Secure");
  }

  return cookie.join("; ");
}
