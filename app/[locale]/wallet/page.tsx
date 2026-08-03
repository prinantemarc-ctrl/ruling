"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { useFormatter, useTranslations } from "next-intl";
import { erc20Abi, getPlatformWallet, getUsdcAddress } from "@/lib/chain";

type Deposit = {
  id: string;
  amount: number;
  status: string;
  txHash: string | null;
  createdAt: string;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  destinationAddress: string;
  txHash: string | null;
  createdAt: string;
};

export default function WalletPage() {
  const t = useTranslations("wallet");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const format = useFormatter();
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<number | null>(null);
  const [authed, setAuthed] = useState(false);
  const [depositAmount, setDepositAmount] = useState("10");
  const [withdrawAmount, setWithdrawAmount] = useState("10");
  const [destination, setDestination] = useState("");
  const [depositId, setDepositId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    const user = await me.json();
    setBalance(user.balance);
    const [d, w] = await Promise.all([
      fetch("/api/deposits").then((r) => r.json()),
      fetch("/api/withdrawals").then((r) => r.json()),
    ]);
    setDeposits(Array.isArray(d) ? d : []);
    setWithdrawals(Array.isArray(w) ? w : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (address && !destination) setDestination(address);
  }, [address, destination]);

  useEffect(() => {
    async function confirm() {
      if (!isSuccess || !txHash || !depositId) return;
      setStatusMsg(t("statusPending"));
      const res = await fetch(`/api/deposits/${depositId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(t("statusConfirmed"));
        void load();
      } else {
        setStatusMsg(data.error || t("statusFailed"));
      }
    }
    void confirm();
  }, [isSuccess, txHash, depositId, load, t]);

  async function onDeposit() {
    setStatusMsg(null);
    const amount = Number(depositAmount);
    if (!(amount > 0)) return;
    const create = await fetch("/api/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const created = await create.json();
    if (!create.ok) {
      setStatusMsg(created.error || te("generic"));
      return;
    }
    setDepositId(created.id);
    const platform = getPlatformWallet();
    if (!platform) {
      setStatusMsg("PLATFORM_WALLET_ADDRESS missing");
      return;
    }
    writeContract({
      address: getUsdcAddress(),
      abi: erc20Abi,
      functionName: "transfer",
      args: [platform as `0x${string}`, parseUnits(String(amount), 6)],
    });
    setStatusMsg(t("statusPending"));
  }

  async function onWithdraw() {
    setStatusMsg(null);
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(withdrawAmount),
        destinationAddress: destination,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || te("generic"));
      return;
    }
    setStatusMsg(t("statusPending"));
    void load();
  }

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      PENDING: t("statusPending"),
      CONFIRMED: t("statusConfirmed"),
      FAILED: t("statusFailed"),
      PROCESSING: t("statusProcessing"),
      SENT: t("statusSent"),
    };
    return map[status] || status;
  }

  if (!isConnected || !authed) {
    return (
      <div className="surface-ink anim-rise grid-mesh rounded-[1.75rem] px-6 py-14 sm:px-10">
        <h1 className="brand text-5xl font-800 text-white sm:text-6xl">
          Ruling<span className="text-accent">.bet</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-white/65">{t("connectFirst")}</p>
      </div>
    );
  }

  return (
    <div>
      <section className="surface-ink anim-rise grid-mesh overflow-hidden rounded-[1.75rem] px-6 py-8 sm:px-10">
        <p className="text-[10px] font-700 uppercase tracking-[0.22em] text-accent">
          {t("title")}
        </p>
        <h1 className="display mt-2 text-3xl font-800 text-white sm:text-4xl">
          {t("balance")}
        </h1>
        <p className="display mt-4 text-[clamp(2.5rem,8vw,4.5rem)] font-800 leading-none text-accent">
          {balance === null
            ? "—"
            : format.number(balance, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          <span className="ml-3 text-2xl text-white/40">{tc("usdc")}</span>
        </p>
        <p className="mt-3 text-sm text-white/45">{t("subtitle")}</p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="surface anim-rise anim-rise-delay-1 rounded-2xl p-5 sm:p-6">
          <h2 className="display text-xl font-700 text-ink">{t("deposit")}</h2>
          <label className="mt-5 block text-[10px] font-700 uppercase tracking-[0.18em] text-slate">
            {t("amount")}
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="mt-2 w-full rounded-md border border-ink/10 bg-white/80 px-3 py-3 outline-none ring-accent focus:ring-2"
          />
          <button
            type="button"
            disabled={isPending || confirming}
            onClick={onDeposit}
            className="btn-signal mt-4 w-full rounded-md px-4 py-3 text-sm disabled:opacity-50"
          >
            {t("depositCta")}
          </button>
        </section>

        <section className="surface anim-rise anim-rise-delay-2 rounded-2xl p-5 sm:p-6">
          <h2 className="display text-xl font-700 text-ink">{t("withdraw")}</h2>
          <label className="mt-5 block text-[10px] font-700 uppercase tracking-[0.18em] text-slate">
            {t("amount")}
          </label>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="mt-2 w-full rounded-md border border-ink/10 bg-white/80 px-3 py-3 outline-none ring-accent focus:ring-2"
          />
          <label className="mt-3 block text-[10px] font-700 uppercase tracking-[0.18em] text-slate">
            {t("destination")}
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-2 w-full rounded-md border border-ink/10 bg-white/80 px-3 py-3 font-mono text-sm outline-none ring-accent focus:ring-2"
          />
          <button
            type="button"
            onClick={onWithdraw}
            className="mt-4 w-full rounded-md border border-ink bg-ink px-4 py-3 text-sm font-700 text-accent transition hover:bg-ink-2"
          >
            {t("withdrawCta")}
          </button>
        </section>
      </div>

      {statusMsg && (
        <p className="mt-4 rounded-md bg-accent/20 px-4 py-3 text-sm font-600 text-accent-ink">
          {statusMsg}
        </p>
      )}

      <section className="mt-8">
        <h2 className="display text-2xl font-700 text-ink">{t("history")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="surface rounded-2xl p-4">
            <h3 className="text-[10px] font-700 uppercase tracking-[0.18em] text-slate">
              {t("deposits")}
            </h3>
            <ul className="mt-3 space-y-2">
              {deposits.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-3 py-2.5 text-sm"
                >
                  <span className="font-700 text-ink">
                    {format.number(d.amount)} {tc("usdc")}
                  </span>
                  <span className="text-xs font-600 text-slate">
                    {statusLabel(d.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface rounded-2xl p-4">
            <h3 className="text-[10px] font-700 uppercase tracking-[0.18em] text-slate">
              {t("withdrawals")}
            </h3>
            <ul className="mt-3 space-y-2">
              {withdrawals.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-3 py-2.5 text-sm"
                >
                  <span className="font-700 text-ink">
                    {format.number(w.amount)} {tc("usdc")}
                  </span>
                  <span className="text-xs font-600 text-slate">
                    {statusLabel(w.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
