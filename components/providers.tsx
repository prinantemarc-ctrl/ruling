"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  lightTheme,
  type Locale,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { polygon } from "wagmi/chains";
import { useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { wagmiConfig } from "@/lib/wagmi";

function rainbowLocale(appLocale: string): Locale {
  return appLocale === "fr" ? "fr" : "en";
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const locale = useLocale();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          locale={rainbowLocale(locale)}
          initialChain={polygon}
          modalSize="compact"
          theme={lightTheme({
            accentColor: "#9bc40a",
            accentColorForeground: "#12150a",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
