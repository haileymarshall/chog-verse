"use client";

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { monad, monadTestnet } from "wagmi/chains";

// Mainnet is where Chogs live (ownership is read server-side); testnet holds the Bank contract
export const wagmiConfig = createConfig({
  chains: [monad, monadTestnet],
  connectors: [injected()],
  transports: { [monad.id]: http(), [monadTestnet.id]: http() },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
