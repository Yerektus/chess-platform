import { proxyAuthRequest } from "@/lib/api";

export async function POST(request: Request) {
  return proxyAuthRequest("/auth/login", await request.json());
}
