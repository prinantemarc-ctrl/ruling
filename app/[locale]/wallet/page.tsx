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
      <div>
        <h1 className="brand text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-4 text-slate">{t("connectFirst")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="brand text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-slate">{t("subtitle")}</p>
      <p className="mt-6 text-2xl font-semibold text-ink">
        {t("balance")}:{" "}
        {balance === null
          ? "—"
          : `${format.number(balance, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${tc("usdc")}`}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="border border-line bg-white/90 p-5">
          <h2 className="font-semibold">{t("deposit")}</h2>
          <label className="mt-4 block text-xs uppercase text-slate">
            {t("amount")}
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="mt-1 w-full border border-line bg-paper px-3 py-2"
          />
          <button
            type="button"
            disabled={isPending || confirming}
            onClick={onDeposit}
            className="mt-4 w-full bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("depositCta")}
          </button>
        </section>

        <section className="border border-line bg-white/90 p-5">
          <h2 className="font-semibold">{t("withdraw")}</h2>
          <label className="mt-4 block text-xs uppercase text-slate">
            {t("amount")}
          </label>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="mt-1 w-full border border-line bg-paper px-3 py-2"
          />
          <label className="mt-3 block text-xs uppercase text-slate">
            {t("destination")}
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-1 w-full border border-line bg-paper px-3 py-2 font-mono text-sm"
          />
          <button
            type="button"
            onClick={onWithdraw}
            className="mt-4 w-full border border-accent px-4 py-2.5 text-sm font-medium text-accent"
          >
            {t("withdrawCta")}
          </button>
        </section>
      </div>

      {statusMsg && <p className="mt-4 text-sm text-slate">{statusMsg}</p>}

      <section className="mt-10">
        <h2 className="font-semibold">{t("history")}</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm uppercase text-slate">{t("deposits")}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {deposits.map((d) => (
                <li key={d.id} className="border border-line bg-white/70 px-3 py-2">
                  {format.number(d.amount)} {tc("usdc")} · {statusLabel(d.status)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm uppercase text-slate">{t("withdrawals")}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {withdrawals.map((w) => (
                <li key={w.id} className="border border-line bg-white/70 px-3 py-2">
                  {format.number(w.amount)} {tc("usdc")} · {statusLabel(w.status)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
