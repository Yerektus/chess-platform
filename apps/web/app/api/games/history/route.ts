import { apiBaseUrl } from "@/lib/api";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") ?? "1";
  const limit = url.searchParams.get("limit") ?? "10";
  const response = await fetch(`${apiBaseUrl}/games/history?page=${page}&limit=${limit}`, {
    cache: "no-store",
    headers: {
      Authorization: authorization
    }
  });
  const payload = await response.json().catch(() => null);

  return Response.json(payload, { status: response.status });
}
