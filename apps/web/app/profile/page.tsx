import { ProfileClient } from "./profile-client";

export default function ProfilePage({ searchParams }: { searchParams: { page?: string } }) {
  return <ProfileClient page={Number(searchParams.page ?? "1")} />;
}
