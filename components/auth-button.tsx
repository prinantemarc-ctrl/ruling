"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { useLocale } from "next-intl";

export function AuthButton({
  onSessionChange,
}: {
  onSessionChange?: () => void;
}) {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const locale = useLocale();
  const [authed, setAuthed] = useState(false);

  const refreshMe = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    setAuthed(res.ok);
    if (res.ok) onSessionChange?.();
  }, [onSessionChange]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe, address]);

  useEffect(() => {
    async function siwe() {
      if (!isConnected || !address || !chainId || authed) return;
      try {
        const nonceRes = await fetch("/api/auth/nonce");
        const { nonce } = await nonceRes.json();
        const message = new SiweMessage({
          domain: window.location.host,
          address,
          statement: "Sign in to Ruling.bet",
          uri: window.location.origin,
          version: "1",
          chainId,
          nonce,
        });
        const prepared = message.prepareMessage();
        const signature = await signMessageAsync({ message: prepared });
        const verify = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prepared, signature }),
        });
        if (verify.ok) {
          setAuthed(true);
          onSessionChange?.();
        }
      } catch {
        // user rejected or auth failed
      }
    }
    void siwe();
  }, [
    isConnected,
    address,
    chainId,
    authed,
    signMessageAsync,
    onSessionChange,
    locale,
  ]);

  return <ConnectButton showBalance={false} chainStatus="icon" />;
}
