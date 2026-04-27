import { refreshTokenCookieName, serializeRefreshTokenCookie } from "@/lib/api";

export async function POST() {
  const response = Response.json({ ok: true });

  response.headers.append("Set-Cookie", serializeRefreshTokenCookie("", 0));
  response.headers.append("Set-Cookie", `${refreshTokenCookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=lax`);

  return response;
}
