"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { truncateAddress } from "@/lib/money";

type Position = {
  id: string;
  question: string;
  outcome: string;
  sharesOwned: number;
  estimatedValue: number;
};

type Trade = {
  id: string;
  question: string;
  side: string;
  outcome: string;
  shares: number;
  cost: number;
  priceAtTrade: number;
  createdAt: string;
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const tw = useTranslations("wallet");
  const format = useFormatter();
  const [address, setAddress] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me");
      if (!me.ok) return;
      const user = await me.json();
      setAddress(user.walletAddress);
      const [p, tr] = await Promise.all([
        fetch("/api/me/positions").then((r) => r.json()),
        fetch("/api/me/trades").then((r) => r.json()),
      ]);
      setPositions(Array.isArray(p) ? p : []);
      setTrades(Array.isArray(tr) ? tr : []);
    }
    void load();
  }, []);

  if (!address) {
    return (
      <div className="surface-ink anim-rise grid-mesh rounded-[1.75rem] px-6 py-14 sm:px-10">
        <h1 className="brand text-5xl font-800 text-white sm:text-6xl">
          Ruling<span className="text-accent">.bet</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-white/65">{tw("connectFirst")}</p>
      </div>
    );
  }

  const totalValue = positions.reduce((s, p) => s + p.estimatedValue, 0);

  return (
    <div>
      <section className="surface anim-rise overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
        <p className="text-[10px] font-700 uppercase tracking-[0.22em] text-slate">
          {t("title")}
        </p>
        <h1 className="display mt-2 text-3xl font-800 text-ink sm:text-4xl">
          {truncateAddress(address)}
        </h1>
        <p className="mt-2 text-slate">{t("subtitle")}</p>
        <div className="mt-6 inline-flex rounded-xl bg-ink px-5 py-4 text-accent">
          <div>
            <div className="text-[10px] font-700 uppercase tracking-[0.18em] text-white/40">
              {t("estimatedValue")}
            </div>
            <div className="display mt-1 text-3xl font-800">
              {format.number(totalValue, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-lg text-white/40">{tc("usdc")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="display text-2xl font-700 text-ink">{t("positions")}</h2>
        {positions.length === 0 ? (
          <p className="mt-3 text-slate">{t("noPositions")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {positions.map((p, i) => (
              <li
                key={p.id}
                className="market-row surface anim-rise rounded-2xl px-5 py-4"
                style={{ animationDelay: `${0.04 * i}s` }}
              >
                <div className="display text-lg font-700 text-ink">{p.question}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-700 ${
                      p.outcome === "YES"
                        ? "bg-accent text-accent-ink"
                        : "bg-no text-white"
                    }`}
                  >
                    {p.outcome}
                  </span>
                  <span className="text-slate">
                    {format.number(p.sharesOwned, { maximumFractionDigits: 4 })}{" "}
                    {t("shares")}
                  </span>
                  <span className="font-700 text-ink">
                    {format.number(p.estimatedValue, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {tc("usdc")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="display text-2xl font-700 text-ink">{t("trades")}</h2>
        {trades.length === 0 ? (
          <p className="mt-3 text-slate">{t("noTrades")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {trades.map((tr) => (
              <li
                key={tr.id}
                className="surface flex flex-col gap-1 rounded-xl px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-700 text-ink">{tr.question}</div>
                  <div className="mt-1 text-slate">
                    {tr.side} {tr.outcome} ·{" "}
                    {format.number(tr.shares, { maximumFractionDigits: 4 })}{" "}
                    {t("shares")}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-700 text-ink">
                    {format.number(tr.cost, { maximumFractionDigits: 4 })}{" "}
                    {tc("usdc")}
                  </div>
                  <div className="text-xs text-slate">
                    {format.dateTime(new Date(tr.createdAt), {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
