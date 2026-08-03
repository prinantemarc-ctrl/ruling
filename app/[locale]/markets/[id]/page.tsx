"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Trade = {
  id: string;
  outcome: "YES" | "NO";
  priceAtTrade: number;
  createdAt: string;
};

type MarketDetail = {
  id: string;
  question: string;
  description: string;
  closesAt: string;
  resolved: boolean;
  prices: {
    YES: { buy: number; sell: number };
    NO: { buy: number; sell: number };
  };
  trades: Trade[];
};

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("markets");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const format = useFormatter();
  const locale = useLocale();
  const { isConnected } = useAccount();
  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [shares, setShares] = useState("10");
  const [quote, setQuote] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/markets/${params.id}`);
    if (res.ok) setMarket(await res.json());
  }, [params.id]);

  useEffect(() => {
    void load();
    fetch("/api/auth/me").then((r) => setAuthed(r.ok));
  }, [load]);

  useEffect(() => {
    const n = Number(shares);
    if (!(n > 0) || !params.id) {
      setQuote(null);
      return;
    }
    const ctrl = new AbortController();
    fetch(
      `/api/markets/${params.id}/quote?outcome=${outcome}&side=${side}&shares=${n}`,
      { signal: ctrl.signal }
    )
      .then((r) => r.json())
      .then((d) => setQuote(typeof d.amount === "number" ? d.amount : null))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [params.id, outcome, side, shares]);

  async function placeTrade() {
    setMessage(null);
    const res = await fetch(`/api/markets/${params.id}/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outcome,
        side,
        shares: Number(shares),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || te("generic"));
      return;
    }
    setMessage(tc("confirm"));
    void load();
  }

  if (!market) {
    return (
      <div className="surface anim-rise rounded-2xl px-5 py-10 text-slate">
        {tc("loading")}
      </div>
    );
  }

  const yesPct = Math.round(market.prices.YES.buy * 100);
  const chartData = market.trades
    .filter((tr) => tr.outcome === "YES")
    .map((tr) => ({
      t: new Date(tr.createdAt).toLocaleString(),
      price: Number((tr.priceAtTrade * 100).toFixed(2)),
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
      <section className="space-y-5">
        <Link
          href={`/${locale}/markets`}
          className="inline-flex text-sm font-600 text-ink/50 transition hover:text-ink"
        >
          ← {t("title")}
        </Link>

        <div className="surface anim-rise rounded-[1.5rem] p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md bg-ink px-2.5 py-1 text-[10px] font-700 uppercase tracking-[0.18em] text-accent">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
              {tc("live")}
            </span>
            <span className="text-xs font-500 uppercase tracking-wide text-slate">
              {t("closesAt", {
                date: format.dateTime(new Date(market.closesAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
            </span>
          </div>

          <h1 className="display text-[clamp(1.8rem,4vw,2.75rem)] font-800 leading-[1.05] text-ink">
            {market.question}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate">{market.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-accent px-4 py-4 text-accent-ink">
              <div className="text-xs font-700 uppercase tracking-wider opacity-70">
                {tc("yes")}
              </div>
              <div className="display mt-1 text-3xl font-800">{yesPct}%</div>
            </div>
            <div className="rounded-xl bg-ink px-4 py-4 text-white">
              <div className="text-xs font-700 uppercase tracking-wider text-white/50">
                {tc("no")}
              </div>
              <div className="display mt-1 text-3xl font-800 text-no">
                {100 - yesPct}%
              </div>
            </div>
          </div>
        </div>

        <div className="surface anim-rise anim-rise-delay-1 rounded-[1.5rem] p-5 sm:p-6">
          <h2 className="display text-lg font-700 text-ink">{t("priceHistory")}</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.length ? chartData : [{ t: "—", price: 50 }]}
              >
                <CartesianGrid stroke="rgba(11,13,16,0.06)" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  width={36}
                  stroke="#9ca3af"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0b0d10",
                    border: "none",
                    borderRadius: 8,
                    color: "#c6f135",
                  }}
                  formatter={(v) => [`${v}%`, tc("yes")]}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#9bc40a"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#c6f135" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <aside className="surface-ink anim-rise anim-rise-delay-2 h-fit rounded-[1.5rem] p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="display text-2xl font-800 text-white">{t("tradePanel")}</h2>
        {!isConnected || !authed ? (
          <p className="mt-6 text-white/60">{t("connectToTrade")}</p>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-700 uppercase tracking-[0.18em] text-white/40">
                {t("outcome")}
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["YES", "NO"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOutcome(o)}
                    className={`rounded-md px-3 py-3 text-sm font-700 transition ${
                      outcome === o
                        ? o === "YES"
                          ? "bg-accent text-accent-ink"
                          : "bg-no text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {o === "YES" ? tc("yes") : tc("no")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-700 uppercase tracking-[0.18em] text-white/40">
                {t("side")}
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["BUY", "SELL"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    className={`rounded-md px-3 py-3 text-sm font-700 transition ${
                      side === s
                        ? "bg-white text-ink"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {s === "BUY" ? tc("buy") : tc("sell")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-700 uppercase tracking-[0.18em] text-white/40">
                {t("shares")}
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-white outline-none ring-accent focus:ring-2"
              />
            </div>

            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-4">
              <div className="text-[10px] font-700 uppercase tracking-[0.18em] text-accent/80">
                {side === "BUY" ? t("estimatedCost") : t("estimatedProceeds")}
              </div>
              <div className="display mt-1 text-3xl font-800 text-accent">
                {quote === null
                  ? "—"
                  : format.number(quote, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                <span className="ml-2 text-base font-600 text-accent/70">
                  {tc("usdc")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={placeTrade}
              className="btn-signal w-full rounded-md px-4 py-3.5 text-sm"
            >
              {t("placeTrade")}
            </button>
            {message && (
              <p className="text-center text-sm text-accent/90">{message}</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
