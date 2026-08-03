"use client";

import { createConfig, http } from "wagmi";
import { polygon } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

const rawProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
export const walletConnectProjectId =
  rawProjectId && !/^0+$/.test(rawProjectId.replace(/-/g, ""))
    ? rawProjectId
    : "";

const connectors = [
  injected({ shimDisconnect: true }),
  metaMask({
    dappMetadata: {
      name: "Ruling.bet",
      url: "https://ruling.bet",
      iconUrl: "https://ruling.bet/icon.png",
    },
  }),
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          metadata: {
            name: "Ruling.bet",
            description: "Prediction markets settled in USDC",
            url: "https://ruling.bet",
            icons: ["https://ruling.bet/icon.png"],
          },
          showQrModal: true,
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [polygon],
  connectors,
  transports: {
    [polygon.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-rpc.com"
    ),
  },
  ssr: true,
});
