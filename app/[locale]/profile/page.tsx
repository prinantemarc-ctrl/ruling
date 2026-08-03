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
      <div>
        <h1 className="brand text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-4 text-slate">{tw("connectFirst")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="brand text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-slate">{t("subtitle")}</p>
      <p className="mt-4 font-mono text-sm text-ink">
        {t("address")}: {truncateAddress(address)}
      </p>

      <section className="mt-8">
        <h2 className="font-semibold">{t("positions")}</h2>
        {positions.length === 0 ? (
          <p className="mt-2 text-slate">{t("noPositions")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {positions.map((p) => (
              <li key={p.id} className="border border-line bg-white/80 px-4 py-3 text-sm">
                <div className="font-medium">{p.question}</div>
                <div className="mt-1 text-slate">
                  {p.outcome} · {format.number(p.sharesOwned, { maximumFractionDigits: 4 })}{" "}
                  {t("shares")} · {t("estimatedValue")}:{" "}
                  {format.number(p.estimatedValue, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {tc("usdc")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-semibold">{t("trades")}</h2>
        {trades.length === 0 ? (
          <p className="mt-2 text-slate">{t("noTrades")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {trades.map((tr) => (
              <li key={tr.id} className="border border-line bg-white/80 px-4 py-3 text-sm">
                <div className="font-medium">{tr.question}</div>
                <div className="mt-1 text-slate">
                  {tr.side} {tr.outcome} · {format.number(tr.shares, { maximumFractionDigits: 4 })}{" "}
                  {t("shares")} · {t("price")}{" "}
                  {format.number(tr.priceAtTrade, { maximumFractionDigits: 4 })} · {t("cost")}{" "}
                  {format.number(tr.cost, { maximumFractionDigits: 4 })} {tc("usdc")} ·{" "}
                  {format.dateTime(new Date(tr.createdAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
