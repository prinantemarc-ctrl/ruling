"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { MARKET_CATEGORIES } from "@/lib/categories";

type Market = {
  id: string;
  question: string;
  category: string;
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
  const tCat = useTranslations("categories");
  const locale = useLocale();
  const format = useFormatter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (category !== "ALL") params.set("category", category);
    const qs = params.toString();
    setLoading(true);
    fetch(`/api/markets${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => setMarkets(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [debouncedQuery, category]);

  const chips = useMemo(
    () => [{ id: "ALL", label: t("allCategories") }, ...MARKET_CATEGORIES.map((id) => ({ id, label: tCat(id) }))],
    [t, tCat]
  );

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

          <div className="anim-rise anim-rise-delay-3 relative mt-8 max-w-xl">
            <label htmlFor="market-search" className="sr-only">
              {t("searchPlaceholder")}
            </label>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">
              ⌕
            </span>
            <input
              id="market-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-white/10 bg-white px-11 py-3.5 text-sm text-ink outline-none ring-accent placeholder:text-ink/35 focus:ring-2"
            />
          </div>
        </div>
      </section>

      <section id="board" className="mt-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="display text-2xl font-700 text-ink sm:text-3xl">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-slate">{t("subtitle")}</p>
          </div>
          <p className="text-xs font-600 uppercase tracking-wide text-slate">
            {t("resultsCount", { count: markets.length })}
          </p>
        </div>

        <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
          {chips.map((chip) => {
            const active = category === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCategory(chip.id)}
                className={`shrink-0 rounded-md px-3 py-2 text-xs font-700 transition ${
                  active
                    ? "bg-ink text-accent"
                    : "border border-ink/10 bg-white/70 text-ink/70 hover:border-ink/25 hover:text-ink"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="surface rounded-2xl px-5 py-10 text-slate">{tc("loading")}</div>
        ) : markets.length === 0 ? (
          <div className="surface rounded-2xl px-6 py-12">
            <p className="display text-2xl font-700 text-ink">{t("noResults")}</p>
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
                  style={{ animationDelay: `${0.04 * Math.min(i, 8)}s` }}
                >
                  <Link
                    href={`/${locale}/markets/${m.id}`}
                    className="market-row surface block rounded-2xl px-5 py-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-2xl">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-700 uppercase tracking-wider text-ink/60">
                            {tCat(m.category as "POLITICS")}
                          </span>
                          {m.tradingAccess === "INTERNAL" && (
                            <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-700 uppercase tracking-wider text-accent">
                              {t("internalBadge")}
                            </span>
                          )}
                        </div>
                        <h3 className="display text-xl font-700 leading-snug text-ink sm:text-2xl">
                          {m.question}
                        </h3>
                      </div>
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
