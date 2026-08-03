"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthButton } from "@/components/auth-button";
import { truncateAddress } from "@/lib/money";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const [balance, setBalance] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      setBalance(null);
      setAddress(null);
      // still check admin secret session
      const admin = await fetch("/api/admin/session").then((r) => r.json());
      setIsAdmin(Boolean(admin.isAdmin));
      return;
    }
    const data = await res.json();
    setBalance(data.balance);
    setAddress(data.walletAddress);
    setIsAdmin(Boolean(data.isAdmin));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const nav = [
    { href: `/${locale}/markets`, label: t("markets") },
    { href: `/${locale}/wallet`, label: t("wallet") },
    { href: `/${locale}/profile`, label: t("profile") },
    { href: `/${locale}/account`, label: t("account") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-[#f3f1ec]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}/markets`}
            className="brand group text-[1.65rem] font-800 leading-none text-ink sm:text-3xl"
          >
            Ruling
            <span className="text-accent-deep transition-colors group-hover:text-accent">
              .bet
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink/65 transition hover:bg-ink/5 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href={`/${locale}/admin`}
                className="rounded-md bg-ink px-3 py-1.5 text-sm font-700 text-accent"
              >
                {t("admin")}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {balance !== null && (
            <div className="hidden items-center gap-2 rounded-md border border-ink/10 bg-white/70 px-3 py-1.5 sm:flex">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <div className="text-right leading-tight">
                <div className="font-display text-sm font-700 text-ink">
                  {new Intl.NumberFormat(locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(balance)}{" "}
                  <span className="text-ink/50">{t("usdc")}</span>
                </div>
                {address && (
                  <div className="font-mono text-[10px] text-slate">
                    {truncateAddress(address)}
                  </div>
                )}
              </div>
            </div>
          )}
          {!address && (
            <Link
              href={`/${locale}/account`}
              className="hidden rounded-md bg-accent px-3 py-1.5 text-xs font-700 text-accent-ink sm:inline-flex"
            >
              {t("signUp")}
            </Link>
          )}
          <LanguageSwitcher />
          <AuthButton onSessionChange={load} />
        </div>
      </div>
    </header>
  );
}
