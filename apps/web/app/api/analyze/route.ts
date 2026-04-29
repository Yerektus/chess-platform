import { apiBaseUrl } from "@/lib/api";

const analyzeTimeoutMs = 25_000;

export async function POST(request: Request) {
  const body = await request.text();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), analyzeTimeoutMs);

  try {
    const response = await fetch(`${apiBaseUrl}/games/analyze`, {
      body,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);

    return Response.json(payload, { status: response.status });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return Response.json({ message: "Анализ занял слишком много времени. Попробуйте ещё раз." }, { status: 504 });
    }

    return Response.json({ message: "Не удалось выполнить анализ" }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
