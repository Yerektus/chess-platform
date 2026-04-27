import { apiBaseUrl, refreshTokenCookieName, serializeRefreshTokenCookie, type TokenResponse } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST() {
  const refreshToken = cookies().get(refreshTokenCookieName)?.value;

  if (!refreshToken) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
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

  nextResponse.headers.append("Set-Cookie", serializeRefreshTokenCookie(payload.refreshToken, 60 * 60 * 24 * 7));

  return nextResponse;
}
