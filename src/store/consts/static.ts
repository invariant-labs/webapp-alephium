import { BTC_ID, ETH_ID, Network, USDC_ID } from "@invariant-labs/alph-sdk";
import { Chain } from "./types";

export enum RPC {
  TEST = "https://node.testnet.alephium.org",
  MAIN = "https://node.mainnet.alephium.org",
}

export const CHAINS = [
  { name: Chain.Solana, address: "https://invariant.app/swap" },
  { name: Chain.AlephZero, address: "https://azero.invariant.app/exchange" },
  { name: Chain.Eclipse, address: "https://eclipse.invariant.app/swap" },
  { name: Chain.Vara, address: "https://vara.invariant.app/exchange" },
  { name: Chain.Alephium, address: "https://alph.invariant.app/exchange" },
];

export const TokenAirdropAmount = {
  BTC: 100000n,
  ETH: 20000000000000000n,
  USDC: 50000000n,
};

export const getFaucetTokenList = (network: Network) => {
  return {
    BTC: BTC_ID[network],
    ETH: ETH_ID[network],
    USDC: USDC_ID[network],
  };
};

export const FAUCET_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.001 * 10 ** 12));
