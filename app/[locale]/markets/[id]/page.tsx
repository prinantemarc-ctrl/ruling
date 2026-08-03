"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useFormatter, useTranslations } from "next-intl";
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
    return <p className="text-slate">{tc("loading")}</p>;
  }

  const chartData = market.trades
    .filter((tr) => tr.outcome === "YES")
    .map((tr) => ({
      t: new Date(tr.createdAt).toLocaleString(),
      price: Number((tr.priceAtTrade * 100).toFixed(2)),
    }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1 className="brand text-3xl font-semibold text-ink">{market.question}</h1>
        <p className="mt-3 text-slate">{market.description}</p>
        <p className="mt-2 text-sm text-slate">
          {t("closesAt", {
            date: format.dateTime(new Date(market.closesAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
        <div className="mt-4 flex gap-4 text-sm font-medium">
          <span className="text-accent">
            {tc("yes")} {Math.round(market.prices.YES.buy * 100)}%
          </span>
          <span className="text-slate">
            {tc("no")} {Math.round(market.prices.NO.buy * 100)}%
          </span>
        </div>

        <div className="mt-8 border border-line bg-white/80 p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate">
            {t("priceHistory")}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.length ? chartData : [{ t: "—", price: 50 }]}>
                <CartesianGrid stroke="#e8edf2" />
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={40} />
                <Tooltip formatter={(v) => [`${v}%`, tc("yes")]} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#1a5f4a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="border border-line bg-white/90 p-5">
        <h2 className="brand text-xl font-semibold">{t("tradePanel")}</h2>
        {!isConnected || !authed ? (
          <p className="mt-4 text-slate">{t("connectToTrade")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs uppercase text-slate">{t("outcome")}</label>
              <div className="mt-1 flex gap-2">
                {(["YES", "NO"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOutcome(o)}
                    className={`flex-1 border px-3 py-2 text-sm ${
                      outcome === o
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line"
                    }`}
                  >
                    {o === "YES" ? tc("yes") : tc("no")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase text-slate">{t("side")}</label>
              <div className="mt-1 flex gap-2">
                {(["BUY", "SELL"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    className={`flex-1 border px-3 py-2 text-sm ${
                      side === s
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line"
                    }`}
                  >
                    {s === "BUY" ? tc("buy") : tc("sell")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase text-slate">{t("shares")}</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="mt-1 w-full border border-line bg-paper px-3 py-2"
              />
            </div>
            <div className="border border-line bg-paper px-3 py-3 text-sm">
              <div className="text-slate">
                {side === "BUY" ? t("estimatedCost") : t("estimatedProceeds")}
              </div>
              <div className="mt-1 text-lg font-semibold text-ink">
                {quote === null
                  ? "—"
                  : `${format.number(quote, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })} ${tc("usdc")}`}
              </div>
            </div>
            <button
              type="button"
              onClick={placeTrade}
              className="w-full bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              {t("placeTrade")}
            </button>
            {message && <p className="text-sm text-slate">{message}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
