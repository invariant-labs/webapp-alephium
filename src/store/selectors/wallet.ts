import { IAlephiumWallet, walletSliceName } from "@store/reducers/wallet";
import { AnyProps, keySelectors } from "./helpers";

const store = (s: AnyProps) => s[walletSliceName] as IAlephiumWallet;

export const {
  address,
  balance,
  tokensBalances,
  status,
  balanceLoading,
  signer,
} = keySelectors(store, [
  "address",
  "balance",
  "tokensBalances",
  "status",
  "balanceLoading",
  "signer",
]);

export const alephiumWalletSelectors = {
  address,
  balance,
  tokensBalances,
  status,
  balanceLoading,
  signer,
};
export default alephiumWalletSelectors;
