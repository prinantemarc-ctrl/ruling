"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { polygon } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        injectedWallet,
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "Ruling.bet",
    projectId,
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [polygon],
  transports: {
    [polygon.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  ssr: true,
});
