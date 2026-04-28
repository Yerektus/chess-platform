import { apiBaseUrl } from "@/lib/api";

export async function POST(request: Request) {
  const body = await request.text();
  const response = await fetch(`${apiBaseUrl}/games/analyze`, {
    body,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const payload = await response.json().catch(() => null);

  return Response.json(payload, { status: response.status });
}
