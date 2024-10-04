import {
  IAlephiumWallet,
  ITokenBalance,
  walletSliceName,
} from "@store/reducers/wallet";
import { AnyProps, keySelectors } from "./helpers";
import { createSelector } from "@reduxjs/toolkit";
import { tokens } from "./pools";
import { ALPH_TOKEN_ID } from "@alephium/web3";
import {
  POOL_SAFE_TRANSACTION_FEE,
  POSITION_SAFE_TRANSACTION_FEE,
  SWAP_SAFE_TRANSACTION_FEE,
} from "@store/consts/static";

const store = (s: AnyProps) => s[walletSliceName] as IAlephiumWallet;

export const {
  address,
  balance,
  tokensBalances,
  status,
  balanceLoading,
  signer,
  showConnectModal,
} = keySelectors(store, [
  "address",
  "balance",
  "tokensBalances",
  "status",
  "balanceLoading",
  "signer",
  "showConnectModal",
]);

export const tokenBalance = (tokenAddress: string) =>
  createSelector(tokensBalances, (tokensAccounts) => {
    if (tokensAccounts[tokenAddress.toString()]) {
      return tokensAccounts[tokenAddress.toString()];
    }
  });

export const tokenBalanceAddress = () =>
  createSelector(tokensBalances, (tokenAccounts) => {
    return Object.values(tokenAccounts).map((item) => {
      return item.address;
    });
  });

export interface SwapToken {
  balance: bigint;
  decimals: bigint;
  symbol: string;
  assetAddress: string;
  name: string;
  logoURI: string;
  isUnknown?: boolean;
  coingeckoId?: string;
}

export const swapTokens = createSelector(
  tokensBalances,
  tokens,
  balance,
  (allAccounts, tokens, alphBalance) => {
    const poolTokens: Record<string, SwapToken> = {};
    Object.entries(tokens).forEach(([key, val]) => {
      poolTokens[key] = {
        ...val,
        assetAddress: val.address,
        balance:
          val.address.toString() === ALPH_TOKEN_ID
            ? BigInt(
                Math.max(Number(alphBalance - SWAP_SAFE_TRANSACTION_FEE), 0)
              )
            : allAccounts[val.address.toString()]?.balance ?? BigInt(0),
      };
    });

    return poolTokens;
  }
);

export const poolTokens = createSelector(
  tokensBalances,
  tokens,
  balance,
  (allAccounts, tokens, alphBalance) => {
    const poolTokens: Record<string, SwapToken> = {};
    Object.entries(tokens).forEach(([key, val]) => {
      poolTokens[key] = {
        ...val,
        assetAddress: val.address,
        balance:
          val.address.toString() === ALPH_TOKEN_ID
            ? BigInt(
                Math.max(Number(alphBalance - POSITION_SAFE_TRANSACTION_FEE), 0)
              )
            : allAccounts[val.address.toString()]?.balance ?? BigInt(0),
      };
    });

    return poolTokens;
  }
);

export const poolTokensWithInitPool = createSelector(
  tokensBalances,
  tokens,
  balance,
  (allAccounts, tokens, alphBalance) => {
    const poolTokens: Record<string, SwapToken> = {};
    Object.entries(tokens).forEach(([key, val]) => {
      poolTokens[key] = {
        ...val,
        assetAddress: val.address,
        balance:
          val.address.toString() === ALPH_TOKEN_ID
            ? BigInt(
                Math.max(
                  Number(
                    alphBalance -
                      POOL_SAFE_TRANSACTION_FEE -
                      POSITION_SAFE_TRANSACTION_FEE
                  ),
                  0
                )
              )
            : allAccounts[val.address.toString()]?.balance ?? BigInt(0),
      };
    });

    return poolTokens;
  }
);

export const tokensDict = createSelector(
  tokensBalances,
  tokens,
  balance,
  (allAccounts, tokens, alphBalance) => {
    const swapTokens: Record<string, SwapToken> = {};
    Object.entries(tokens).forEach(([key, val]) => {
      swapTokens[key] = {
        ...val,
        assetAddress: val.address,
        balance:
          val.address.toString() === ALPH_TOKEN_ID
            ? BigInt(alphBalance)
            : allAccounts[val.address.toString()]?.balance ?? BigInt(0),
      };
    });

    return swapTokens;
  }
);

export type TokenBalances = ITokenBalance & {
  symbol: string;
  usdValue: bigint;
  assetDecimals: number;
};

export const alephiumWalletSelectors = {
  address,
  balance,
  tokensBalances,
  status,
  balanceLoading,
  signer,
  showConnectModal,
};
export default alephiumWalletSelectors;
