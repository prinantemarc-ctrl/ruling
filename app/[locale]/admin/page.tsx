"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MARKET_CATEGORIES } from "@/lib/categories";

type Market = {
  id: string;
  question: string;
  category?: string;
  tradingAccess: string;
  resolved: boolean;
  closesAt: string;
  currency: string;
  prices: { YES: { buy: number }; NO: { buy: number } };
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  destinationAddress: string;
  walletAddress: string;
  createdAt: string;
};

export default function AdminPage() {
  const t = useTranslations("admin");
  const tCat = useTranslations("categories");
  const locale = useLocale();
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    question: "",
    description: "",
    category: "POLITICS",
    closesAt: "",
    maxLossAllowed: "50",
    spreadMarkup: "0.02",
  });

  const load = useCallback(async () => {
    const session = await fetch("/api/admin/session").then((r) => r.json());
    if (!session.isAdmin) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    const [m, w, rev] = await Promise.all([
      fetch("/api/admin/markets").then((r) => r.json()),
      fetch("/api/admin/withdrawals").then((r) => r.json()),
      fetch("/api/admin/revenue").then((r) => r.json()),
    ]);
    setMarkets(Array.isArray(m) ? m : []);
    setWithdrawals(Array.isArray(w) ? w : []);
    setRevenue(typeof rev.totalPlatformMargin === "number" ? rev.totalPlatformMargin : 0);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("loginFailed"));
      return;
    }
    setSecret("");
    void load();
  }

  async function createMarket(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const closesAt = new Date(form.closesAt).toISOString();
    const res = await fetch("/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: form.question,
        description: form.description,
        category: form.category,
        closesAt,
        maxLossAllowed: Number(form.maxLossAllowed),
        spreadMarkup: Number(form.spreadMarkup),
        currency: "REAL",
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || t("createFailed"));
      return;
    }
    setForm({
      question: "",
      description: "",
      category: "POLITICS",
      closesAt: "",
      maxLossAllowed: "50",
      spreadMarkup: "0.02",
    });
    void load();
  }

  async function publish(id: string) {
    await fetch(`/api/markets/${id}/publish`, { method: "POST" });
    void load();
  }

  async function resolve(id: string, outcome: "YES" | "NO") {
    if (!confirm(t("confirmResolve", { outcome }))) return;
    await fetch(`/api/markets/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    void load();
  }

  async function processWithdrawal(id: string) {
    const txHash = prompt(t("txHashPrompt"));
    if (!txHash) return;
    await fetch(`/api/admin/withdrawals/${id}/process-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash }),
    });
    void load();
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md">
        <div className="surface-ink anim-rise rounded-2xl p-8">
          <h1 className="display text-3xl font-800 text-white">{t("title")}</h1>
          <p className="mt-2 text-sm text-white/55">{t("loginHint")}</p>
          <form onSubmit={login} className="mt-6 space-y-4">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={t("secretPlaceholder")}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-white outline-none ring-accent focus:ring-2"
            />
            <button type="submit" className="btn-signal w-full rounded-md py-3 text-sm">
              {t("login")}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-no">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-700 uppercase tracking-[0.22em] text-slate">
            {t("badge")}
          </p>
          <h1 className="display text-3xl font-800 text-ink sm:text-4xl">
            {t("title")}
          </h1>
        </div>
        <div className="rounded-xl bg-ink px-5 py-3 text-accent">
          <div className="text-[10px] font-700 uppercase tracking-wider text-white/40">
            {t("revenue")}
          </div>
          <div className="display text-2xl font-800">
            {revenue === null ? "—" : revenue.toFixed(2)} USDC
          </div>
        </div>
      </header>

      {error && (
        <p className="rounded-md bg-no/15 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <section className="surface rounded-2xl p-5 sm:p-6">
        <h2 className="display text-xl font-700">{t("createMarket")}</h2>
        <form onSubmit={createMarket} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder={t("question")}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="sm:col-span-2 rounded-md border border-ink/10 bg-white/80 px-3 py-3"
          />
          <textarea
            required
            placeholder={t("description")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="sm:col-span-2 min-h-[88px] rounded-md border border-ink/10 bg-white/80 px-3 py-3"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-md border border-ink/10 bg-white/80 px-3 py-3"
          >
            {MARKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tCat(c)}
              </option>
            ))}
          </select>
          <input
            required
            type="datetime-local"
            value={form.closesAt}
            onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
            className="rounded-md border border-ink/10 bg-white/80 px-3 py-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="1"
              value={form.maxLossAllowed}
              onChange={(e) => setForm({ ...form, maxLossAllowed: e.target.value })}
              className="rounded-md border border-ink/10 bg-white/80 px-3 py-3"
              placeholder="maxLoss"
            />
            <input
              type="number"
              step="0.01"
              value={form.spreadMarkup}
              onChange={(e) => setForm({ ...form, spreadMarkup: e.target.value })}
              className="rounded-md border border-ink/10 bg-white/80 px-3 py-3"
              placeholder="markup"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="btn-signal sm:col-span-2 rounded-md py-3 text-sm disabled:opacity-50"
          >
            {t("create")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="display text-xl font-700">{t("markets")}</h2>
        <ul className="mt-3 space-y-2">
          {markets.map((m) => (
            <li
              key={m.id}
              className="surface flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/${locale}/markets/${m.id}`}
                  className="font-700 text-ink hover:underline"
                >
                  {m.question}
                </Link>
                <div className="mt-1 text-xs text-slate">
                  {m.tradingAccess} · {m.resolved ? "RESOLVED" : "OPEN"} · YES{" "}
                  {Math.round(m.prices.YES.buy * 100)}%
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.tradingAccess === "INTERNAL" && !m.resolved && (
                  <button
                    type="button"
                    onClick={() => publish(m.id)}
                    className="rounded-md bg-accent px-3 py-1.5 text-xs font-700 text-accent-ink"
                  >
                    {t("publish")}
                  </button>
                )}
                {!m.resolved && (
                  <>
                    <button
                      type="button"
                      onClick={() => resolve(m.id, "YES")}
                      className="rounded-md bg-ink px-3 py-1.5 text-xs font-700 text-accent"
                    >
                      {t("resolveYes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve(m.id, "NO")}
                      className="rounded-md bg-ink px-3 py-1.5 text-xs font-700 text-no"
                    >
                      {t("resolveNo")}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="display text-xl font-700">{t("withdrawals")}</h2>
        <ul className="mt-3 space-y-2">
          {withdrawals.length === 0 ? (
            <p className="text-sm text-slate">{t("noWithdrawals")}</p>
          ) : (
            withdrawals.map((w) => (
              <li
                key={w.id}
                className="surface flex flex-col gap-2 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <div className="font-700">
                    {w.amount} USDC · {w.status}
                  </div>
                  <div className="font-mono text-xs text-slate">
                    {w.walletAddress} → {w.destinationAddress}
                  </div>
                </div>
                {w.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => processWithdrawal(w.id)}
                    className="rounded-md border border-ink px-3 py-1.5 text-xs font-700"
                  >
                    {t("markSent")}
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
