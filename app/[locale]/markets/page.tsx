"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations, useFormatter } from "next-intl";

type Market = {
  id: string;
  question: string;
  closesAt: string;
  tradingAccess: string;
  prices: {
    YES: { buy: number; sell: number };
    NO: { buy: number; sell: number };
  };
};

export default function MarketsPage() {
  const t = useTranslations("markets");
  const tc = useTranslations("common");
  const locale = useLocale();
  const format = useFormatter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((data) => setMarkets(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="brand text-3xl font-semibold text-ink">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-slate">{t("subtitle")}</p>

      {loading ? (
        <p className="mt-8 text-slate">{tc("loading")}</p>
      ) : markets.length === 0 ? (
        <p className="mt-8 text-slate">{t("empty")}</p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {markets.map((m) => {
            const yesPct = Math.round(m.prices.YES.buy * 100);
            return (
              <li key={m.id}>
                <Link
                  href={`/${locale}/markets/${m.id}`}
                  className="block border border-line bg-white/80 p-5 transition hover:border-accent"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-lg font-medium text-ink">{m.question}</h2>
                    {m.tradingAccess === "INTERNAL" && (
                      <span className="rounded bg-accent-soft px-2 py-0.5 text-xs text-accent">
                        {t("internalBadge")}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="font-semibold text-accent">
                      {tc("yes")} {yesPct}%
                    </span>
                    <span className="text-slate">
                      {tc("no")} {100 - yesPct}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden bg-mist">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${yesPct}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate">
                    {t("closesAt", {
                      date: format.dateTime(new Date(m.closesAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                    })}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
