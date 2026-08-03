"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthButton } from "@/components/auth-button";
import { truncateAddress } from "@/lib/money";

export function Header() {
  const t = useTranslations("common");
  const tw = useTranslations("wallet");
  const locale = useLocale();
  const [balance, setBalance] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      setBalance(null);
      setAddress(null);
      return;
    }
    const data = await res.json();
    setBalance(data.balance);
    setAddress(data.walletAddress);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <header className="border-b border-line/80 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href={`/${locale}/markets`} className="brand text-2xl font-semibold tracking-tight text-ink">
            {t("brand")}
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-slate sm:flex">
            <Link href={`/${locale}/markets`} className="hover:text-ink">
              {t("markets")}
            </Link>
            <Link href={`/${locale}/wallet`} className="hover:text-ink">
              {t("wallet")}
            </Link>
            <Link href={`/${locale}/profile`} className="hover:text-ink">
              {t("profile")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {balance !== null && (
            <div className="hidden text-right text-sm sm:block">
              <div className="font-medium text-ink">
                {new Intl.NumberFormat(locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(balance)}{" "}
                {t("usdc")}
              </div>
              {address && (
                <div className="text-xs text-slate">{truncateAddress(address)}</div>
              )}
              <span className="sr-only">{tw("balance")}</span>
            </div>
          )}
          <LanguageSwitcher />
          <AuthButton onSessionChange={load} />
        </div>
      </div>
    </header>
  );
}
