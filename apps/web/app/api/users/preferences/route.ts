import { apiBaseUrl } from "@/lib/api";

export async function PATCH(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const body = await request.text();
  const response = await fetch(`${apiBaseUrl}/users/me/preferences`, {
    body,
    cache: "no-store",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });
  const payload = await response.json().catch(() => null);

  return Response.json(payload, { status: response.status });
}
