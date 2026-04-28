import { apiBaseUrl } from "@/lib/api";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(`${apiBaseUrl}/payments/cancel-subscription`, {
    cache: "no-store",
    headers: {
      Authorization: authorization
    },
    method: "POST"
  });
  const payload = await response.json().catch(() => null);

  return Response.json(payload, { status: response.status });
}
