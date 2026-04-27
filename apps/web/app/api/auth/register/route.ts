import { proxyAuthRequest } from "@/lib/api";

export async function POST(request: Request) {
  return proxyAuthRequest("/auth/register", await request.json());
}
