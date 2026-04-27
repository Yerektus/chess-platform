import { apiBaseUrl } from "@/lib/api";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(`${apiBaseUrl}/users/me`, {
    cache: "no-store",
    headers: {
      Authorization: authorization
    }
  });
  const payload = await response.json().catch(() => null);

  return Response.json(payload, { status: response.status });
}
