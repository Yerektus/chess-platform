import { normalizeInternalPath } from "@/lib/navigation";
import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return <LoginForm nextPath={normalizeInternalPath(searchParams.next)} />;
}
