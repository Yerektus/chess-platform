import { apiBaseUrl } from "@/lib/api";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const body = await request.text();
  const response = await fetch(`${apiBaseUrl}/games`, {
    body,
    cache: "no-store",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const payload = await response.json().catch(() => null);

  return Response.json(payload, { status: response.status });
}
