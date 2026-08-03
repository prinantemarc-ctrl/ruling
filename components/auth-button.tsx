"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { polygon } from "wagmi/chains";
import { SiweMessage } from "siwe";
import { useLocale, useTranslations } from "next-intl";

type Status = "idle" | "signing" | "error" | "ok";

export function AuthButton({
  onSessionChange,
}: {
  onSessionChange?: () => void;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { address, chainId, isConnected, isConnecting } = useAccount();
  const { signMessageAsync, isPending: isSigningMsg } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const [authed, setAuthed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const signingRef = useRef(false);

  const refreshMe = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const ok = res.ok;
    setAuthed(ok);
    if (ok) {
      setStatus("ok");
      onSessionChange?.();
    }
    return ok;
  }, [onSessionChange]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe, address]);

  const signIn = useCallback(async () => {
    if (!address || signingRef.current) return;
    signingRef.current = true;
    setStatus("signing");
    setError(null);
    try {
      if (chainId !== polygon.id) {
        await switchChainAsync({ chainId: polygon.id });
      }

      const nonceRes = await fetch("/api/auth/nonce");
      if (!nonceRes.ok) throw new Error(t("nonceFailed"));
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: t("siweStatement"),
        uri: window.location.origin,
        version: "1",
        chainId: polygon.id,
        nonce,
      });
      const prepared = message.prepareMessage();
      const signature = await signMessageAsync({ message: prepared });

      const verify = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prepared, signature }),
      });
      const data = await verify.json().catch(() => ({}));
      if (!verify.ok) {
        throw new Error(data.error || t("verifyFailed"));
      }
      setAuthed(true);
      setStatus("ok");
      onSessionChange?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("signRejected");
      setError(msg);
      setStatus("error");
      setAuthed(false);
    } finally {
      signingRef.current = false;
    }
  }, [
    address,
    chainId,
    onSessionChange,
    signMessageAsync,
    switchChainAsync,
    t,
  ]);

  // Auto SIWE once after wallet connects (single attempt; then manual retry)
  useEffect(() => {
    if (!isConnected || !address || authed || status === "signing") return;
    if (status === "error") return;
    void signIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot on connect
  }, [isConnected, address, authed]);

  return (
    <div className="flex flex-col items-end gap-1">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          if (!ready) {
            return (
              <button
                type="button"
                disabled
                className="rounded-md bg-ink/10 px-3 py-2 text-xs font-700 text-ink/40"
              >
                {t("connect")}
              </button>
            );
          }

          if (!account) {
            return (
              <button
                type="button"
                onClick={openConnectModal}
                disabled={isConnecting}
                className="rounded-md bg-accent px-3 py-2 text-xs font-700 text-accent-ink transition hover:brightness-105 disabled:opacity-60 sm:px-4 sm:text-sm"
              >
                {isConnecting ? t("connecting") : t("connect")}
              </button>
            );
          }

          if (chain?.unsupported || (chain && chain.id !== polygon.id)) {
            return (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await switchChainAsync({ chainId: polygon.id });
                  } catch {
                    openChainModal?.();
                  }
                }}
                className="rounded-md bg-no px-3 py-2 text-xs font-700 text-white sm:text-sm"
              >
                {t("wrongNetwork")}
              </button>
            );
          }

          if (!authed) {
            return (
              <button
                type="button"
                onClick={() => void signIn()}
                disabled={status === "signing" || isSigningMsg}
                className="rounded-md bg-ink px-3 py-2 text-xs font-700 text-accent disabled:opacity-60 sm:px-4 sm:text-sm"
              >
                {status === "signing" || isSigningMsg ? t("signing") : t("signIn")}
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={openAccountModal}
              className="rounded-md border border-ink/15 bg-white/80 px-3 py-2 font-mono text-xs font-600 text-ink sm:text-sm"
              title={account.address}
            >
              {account.displayName}
            </button>
          );
        }}
      </ConnectButton.Custom>
      {error && (
        <p className="max-w-[220px] text-right text-[10px] font-600 text-danger">
          {error}
        </p>
      )}
      <span className="sr-only">{locale}</span>
    </div>
  );
}
