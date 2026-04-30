"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { type AuthUser, type GameHistoryResponse } from "@/lib/auth-types";
import { Button, Card } from "@chess-platform/ui";
import { type FormEvent, useEffect, useMemo, useState } from "react";

export function ProfileClient({ page }: { page: number }) {
  const { accessToken, user, isLoading, logout, updateUser } = useAuth();
  const [history, setHistory] = useState<GameHistoryResponse | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [city, setCity] = useState(user?.city ?? "");
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [citySaveError, setCitySaveError] = useState<string | null>(null);
  const [citySaveStatus, setCitySaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "subscriptions">("profile");
  const savedCity = user?.city?.trim() ?? "";
  const normalizedCity = useMemo(() => city.trim(), [city]);
  const canSaveCity = Boolean(accessToken) && !isSavingCity && normalizedCity !== savedCity;

  useEffect(() => {
    setCity(user?.city ?? "");
  }, [user?.city]);

  const handleSaveCity = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!accessToken) {
      setCitySaveError("Войдите в аккаунт, чтобы сохранить город.");
      return;
    }

    if (normalizedCity === savedCity) {
      return;
    }

    setIsSavingCity(true);
    setCitySaveError(null);
    setCitySaveStatus(null);

    try {
      const response = await fetch("/api/users/city", {
        body: JSON.stringify({ city: normalizedCity }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });

      const payload = (await response.json().catch(() => null)) as AuthUser | { message?: string } | null;

      if (!response.ok) {
        throw new Error((payload as { message?: string })?.message ?? "Unable to save city");
      }

      if (!payload || !("id" in payload)) {
        throw new Error("Unable to save city");
      }

      updateUser(payload);
      setCity(payload.city ?? "");
      setCitySaveStatus(normalizedCity ? "Город сохранён." : "Город удалён.");
    } catch (caughtError) {
      setCitySaveError(caughtError instanceof Error ? caughtError.message : "Unable to save city");
    } finally {
      setIsSavingCity(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;

    async function loadHistory() {
      setHistoryError(null);

      try {
        const response = await fetch(`/api/games/history?page=${page}&limit=10`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error("Unable to load game history");
        }

        const payload = (await response.json()) as GameHistoryResponse;

        if (active) {
          setHistory(payload);
        }
      } catch (caughtError) {
        if (active) {
          setHistoryError(caughtError instanceof Error ? caughtError.message : "Unable to load game history");
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [accessToken, page]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
        <div className="mx-auto max-w-[1200px] text-[15px] text-[var(--color-text-secondary)]">Loading profile</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8 text-[var(--color-text-primary)] md:px-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-medium leading-[1.2]">Profile</h1>
            <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">Account and game history.</p>
          </div>
          <Button onClick={logout} variant="ghost">
            Log out
          </Button>
        </header>

        <div className="flex gap-2 border-b border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-[14px] font-medium ${
              activeTab === "profile"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-2 text-[14px] font-medium ${
              activeTab === "subscriptions"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Subscriptions
          </button>
        </div>

        {activeTab === "profile" ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <ProfileStat label="Username" value={user?.username ?? "Unavailable"} />
              <ProfileStat label="ELO" value={String(user?.elo ?? "Unavailable")} />
              <Card>
                <form className="flex h-full flex-col gap-3" onSubmit={handleSaveCity}>
                  <div>
                    <p className="text-[13px] text-[var(--color-text-secondary)]">City</p>
                    <p className="mt-1 text-[18px] font-medium">{savedCity || "Not specified"}</p>
                  </div>
                  <input
                    aria-label="City"
                    autoComplete="address-level2"
                    className="min-h-11 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[15px] text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent)]"
                    maxLength={80}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setCitySaveError(null);
                      setCitySaveStatus(null);
                    }}
                    placeholder="Например, Алматы"
                    value={city}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-h-5 text-[12px] text-[var(--color-text-secondary)]">
                      {citySaveError ?? citySaveStatus ?? "Город будет виден в рейтинге."}
                    </p>
                    <Button className="min-h-10 shrink-0" disabled={!canSaveCity} type="submit">
                      {isSavingCity ? "Сохраняем..." : "Сохранить"}
                    </Button>
                  </div>
                </form>
              </Card>
            </section>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-medium leading-[1.2]">Game history</h2>
                  <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                    {history ? `${history.total} games` : "Loading games"}
                  </p>
                </div>
              </div>

              {historyError ? <p className="text-[13px] text-[var(--color-text-secondary)]">{historyError}</p> : null}

              <div className="overflow-x-auto rounded-[6px] border border-[var(--color-border)]">
                <table className="w-full border-collapse text-[15px]">
                  <thead className="bg-[var(--color-surface)] text-[13px] text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-3 py-3 text-left font-normal">Created</th>
                      <th className="px-3 py-3 text-left font-normal">Opponent</th>
                      <th className="px-3 py-3 text-left font-normal">Result</th>
                      <th className="px-3 py-3 text-left font-normal">PGN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history?.items.length ? (
                      history.items.map((game, index) => (
                        <tr
                          className={index % 2 === 0 ? "bg-[var(--color-bg)]" : "bg-[var(--color-surface)]"}
                          key={game.id}
                        >
                          <td className="px-3 py-3">{new Date(game.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-3">{game.opponent}</td>
                          <td className="px-3 py-3">{game.result ?? "In progress"}</td>
                          <td className="max-w-[360px] truncate px-3 py-3 font-mono text-[13px]">{game.pgn}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-6 text-[var(--color-text-secondary)]" colSpan={4}>
                          No games
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          <SubscriptionManager accessToken={accessToken} userPlan={user?.plan} />
        )}
      </div>
    </main>
  );
}

type SubscriptionResponse = {
  subscription: {
    id: string;
    status: string;
    priceId: string | null;
  } | null;
  nextBillingDate: string | null;
};

function SubscriptionManager({
  accessToken,
  userPlan
}: {
  accessToken: string | null;
  userPlan?: string;
}) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    fetch("/api/payments/subscription", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setSubscriptionData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load subscription");
        setIsLoading(false);
      });
  }, [accessToken]);

  const handleCancelSubscription = async () => {
    if (!accessToken || !confirm("Are you sure you want to cancel your subscription?")) return;

    setIsCancelling(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/cancel-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      alert("Subscription cancelled successfully");
      setSubscriptionData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubscribe = async () => {
    if (!accessToken) {
      setError("Please log in to subscribe");
      return;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as { url?: string; message?: string } | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.message ?? "Failed to create checkout session");
      }

      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open checkout");
      setIsSubscribing(false);
    }
  };

  if (isLoading) {
    return <div className="text-[var(--color-text-secondary)]">Loading subscription info...</div>;
  }

  return (
    <Card>
      <h2 className="text-[24px] font-medium">Subscription Management</h2>

      {error && <p className="mt-4 text-[14px] text-red-500">{error}</p>}

      {userPlan === "pro" && subscriptionData ? (
        <div className="mt-6">
          <div className="rounded-lg border border-[var(--color-border)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] text-[var(--color-text-secondary)]">Current Plan</p>
                <p className="mt-1 text-[18px] font-medium">Premium 👑</p>
              </div>
              <Button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                variant="ghost"
              >
                {isCancelling ? "Cancelling..." : "Cancel"}
              </Button>
            </div>

            {subscriptionData.nextBillingDate && (
              <p className="mt-4 text-[13px] text-[var(--color-text-secondary)]">
                Next billing: {new Date(subscriptionData.nextBillingDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="rounded-lg border border-[var(--color-border)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] text-[var(--color-text-secondary)]">Current Plan</p>
                <p className="mt-1 text-[18px] font-medium">Free</p>
                <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
                  Upgrade to Premium to unlock advanced features.
                </p>
              </div>
              <Button
                onClick={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? "Processing..." : "Upgrade Now"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-[13px] text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-[24px] font-medium leading-[1.2]">{value}</p>
    </Card>
  );
}
