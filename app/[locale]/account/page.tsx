"use client";

import { useCallback, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { truncateAddress } from "@/lib/money";

export default function AccountPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { isConnected } = useAccount();
  const [user, setUser] = useState<{
    walletAddress: string;
    balance: number;
    playBalance: number;
    isNew?: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      setUser(null);
      return;
    }
    setUser(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load, isConnected]);

  return (
    <div className="mx-auto max-w-2xl">
      <section className="surface-ink anim-rise grid-mesh rounded-[1.75rem] px-6 py-10 sm:px-10">
        <p className="text-[10px] font-700 uppercase tracking-[0.22em] text-accent">
          {t("badge")}
        </p>
        <h1 className="brand mt-3 text-4xl font-800 text-white sm:text-5xl">
          Ruling<span className="text-accent">.bet</span>
        </h1>
        <p className="mt-4 max-w-md text-white/65">{t("subtitle")}</p>

        <ol className="mt-8 space-y-3 text-sm text-white/80">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-800 text-accent-ink">
              1
            </span>
            {t("step1")}
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-800 text-accent-ink">
              2
            </span>
            {t("step2")}
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-800 text-accent-ink">
              3
            </span>
            {t("step3")}
          </li>
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <AuthButton onSessionChange={load} />
          <ConnectButton.Custom>
            {({ openConnectModal, mounted, account }) =>
              mounted && !account ? (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="btn-signal rounded-md px-5 py-3 text-sm"
                >
                  {t("createAccount")}
                </button>
              ) : null
            }
          </ConnectButton.Custom>
        </div>
      </section>

      {user && (
        <section className="surface anim-rise anim-rise-delay-1 mt-5 rounded-2xl p-6">
          <h2 className="display text-xl font-700 text-ink">{t("yourAccount")}</h2>
          <p className="mt-2 font-mono text-sm text-slate">
            {truncateAddress(user.walletAddress)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-ink px-4 py-4 text-accent">
              <div className="text-[10px] font-700 uppercase tracking-wider text-white/40">
                {tc("usdc")}
              </div>
              <div className="display mt-1 text-2xl font-800">
                {user.balance.toFixed(2)}
              </div>
            </div>
            <div className="rounded-xl bg-accent/20 px-4 py-4 text-accent-ink">
              <div className="text-[10px] font-700 uppercase tracking-wider opacity-60">
                {t("playBalance")}
              </div>
              <div className="display mt-1 text-2xl font-800">
                {user.playBalance.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/wallet`}
              className="btn-signal rounded-md px-4 py-2.5 text-sm"
            >
              {t("goWallet")}
            </Link>
            <Link
              href={`/${locale}/markets`}
              className="rounded-md border border-ink px-4 py-2.5 text-sm font-700"
            >
              {t("goMarkets")}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
