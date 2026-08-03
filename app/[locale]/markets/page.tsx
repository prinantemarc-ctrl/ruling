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
      <section className="relative overflow-hidden rounded-[1.75rem] surface-ink grid-mesh px-6 py-10 sm:px-10 sm:py-14 shadow-signal">
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-no/20 blur-3xl" />

        <div className="relative max-w-3xl">
          <p className="anim-rise mb-4 inline-flex items-center gap-2 text-xs font-600 uppercase tracking-[0.22em] text-accent">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
            {tc("live")}
          </p>
          <h1 className="anim-rise anim-rise-delay-1 brand text-[clamp(3.2rem,10vw,5.8rem)] font-800 leading-[0.9] text-white">
            Ruling<span className="text-accent">.bet</span>
          </h1>
          <p className="anim-rise anim-rise-delay-2 mt-5 max-w-xl text-lg text-white/75 sm:text-xl">
            {t("heroTagline")}
          </p>
          <p className="anim-rise anim-rise-delay-3 mt-2 max-w-lg text-sm text-white/45">
            {t("heroSupport")}
          </p>
          <a
            href="#board"
            className="anim-rise anim-rise-delay-3 btn-signal mt-8 inline-flex rounded-md px-5 py-3 text-sm"
          >
            {t("browse")}
          </a>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-0 right-0 overflow-hidden opacity-40">
          <div className="ticker-track flex whitespace-nowrap font-mono text-[11px] text-accent">
            <span className="px-8">
              YES 52.4 · NO 47.6 · USDC · POLYGON · LMSR · SPREAD ON ·{" "}
            </span>
            <span className="px-8">
              YES 52.4 · NO 47.6 · USDC · POLYGON · LMSR · SPREAD ON ·{" "}
            </span>
          </div>
        </div>
      </section>

      <section id="board" className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="display text-2xl font-700 text-ink sm:text-3xl">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-slate">{t("subtitle")}</p>
          </div>
        </div>

        {loading ? (
          <div className="surface rounded-2xl px-5 py-10 text-slate">{tc("loading")}</div>
        ) : markets.length === 0 ? (
          <div className="surface rounded-2xl px-6 py-12">
            <p className="display text-2xl font-700 text-ink">{t("empty")}</p>
            <p className="mt-2 text-slate">{t("emptyCta")}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {markets.map((m, i) => {
              const yesPct = Math.round(m.prices.YES.buy * 100);
              const noPct = 100 - yesPct;
              return (
                <li
                  key={m.id}
                  className="anim-rise"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <Link
                    href={`/${locale}/markets/${m.id}`}
                    className="market-row surface block rounded-2xl px-5 py-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="display max-w-2xl text-xl font-700 leading-snug text-ink sm:text-2xl">
                        {m.question}
                      </h3>
                      {m.tradingAccess === "INTERNAL" && (
                        <span className="rounded-md bg-ink px-2 py-1 text-[10px] font-700 uppercase tracking-wider text-accent">
                          {t("internalBadge")}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm font-700">
                          <span className="text-accent-ink">
                            <span className="rounded-sm bg-accent px-1.5 py-0.5">
                              {tc("yes")} {yesPct}%
                            </span>
                          </span>
                          <span className="text-no">
                            {tc("no")} {noPct}%
                          </span>
                        </div>
                        <div className="flex h-3 overflow-hidden rounded-sm bg-ink/10">
                          <div
                            className="prob-bar-fill h-full bg-accent"
                            style={{ width: `${yesPct}%` }}
                          />
                          <div
                            className="h-full bg-no/80"
                            style={{ width: `${noPct}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs font-500 uppercase tracking-wide text-slate">
                        {t("closesAt", {
                          date: format.dateTime(new Date(m.closesAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }),
                        })}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
