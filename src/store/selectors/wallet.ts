import { TESTNET_WAZERO_ADDRESS } from '@invariant-labs/a0-sdk'
import { BN } from '@polkadot/util'
import { createSelector } from '@reduxjs/toolkit'
import { POOL_SAFE_TRANSACTION_FEE, SWAP_SAFE_TRANSACTION_FEE } from '@store/consts/static'
import { IAlephZeroWallet, ITokenBalance, walletSliceName } from '@store/reducers/wallet'
import { AnyProps, keySelectors } from './helpers'
import { tokens } from './pools'

const store = (s: AnyProps) => s[walletSliceName] as IAlephZeroWallet

export const { address, balance, tokensBalances, status, balanceLoading } = keySelectors(store, [
  'address',
  'balance',
  'tokensBalances',
  'status',
  'balanceLoading'
])

export const tokenBalance = (tokenAddress: string) =>
  createSelector(tokensBalances, tokensAccounts => {
    if (tokensAccounts[tokenAddress.toString()]) {
      return tokensAccounts[tokenAddress.toString()]
    }
  })

export const tokenBalanceAddress = () =>
  createSelector(tokensBalances, tokenAccounts => {
    return Object.values(tokenAccounts).map(item => {
      return item.address
    })
  })

export interface SwapToken {
  balance: bigint
  decimals: bigint
  symbol: string
  assetAddress: string
  name: string
  logoURI: string
  isUnknown?: boolean
  coingeckoId?: string
}

export const swapTokens = createSelector(
  tokensBalances,
  tokens,
  balance,
  (allAccounts, tokens, a0Balance) => {
    return Object.values(tokens).map(token => ({
      ...token,
      assetAddress: token.address,
      balance:
        token.address.toString() === TESTNET_WAZERO_ADDRESS
          ? BigInt(Math.max(Number(a0Balance - SWAP_SAFE_TRANSACTION_FEE), 0))
          : allAccounts[token.address.toString()]?.balance ?? 0n
    }))
  }
)

export const poolTokens = createSelector(
  tokensBalances,
  tokens,
  balance,
  (allAccounts, tokens, a0Balance) => {
    return Object.values(tokens).map(token => ({
      ...token,
      assetAddress: token.address,
      balance:
        token.address.toString() === TESTNET_WAZERO_ADDRESS
          ? BigInt(Math.max(Number(a0Balance - POOL_SAFE_TRANSACTION_FEE), 0))
          : allAccounts[token.address.toString()]?.balance ?? 0n
    }))
  }
)

export const swapTokensDict = createSelector(
  tokensBalances,
  tokens,
  balance,
  (allAccounts, tokens, a0Balance) => {
    const swapTokens: Record<string, SwapToken> = {}
    Object.entries(tokens).forEach(([key, val]) => {
      swapTokens[key] = {
        ...val,
        assetAddress: val.address,
        balance:
          val.address.toString() === TESTNET_WAZERO_ADDRESS
            ? BigInt(a0Balance)
            : allAccounts[val.address.toString()]?.balance ?? BigInt(0)
      }
    })

    return swapTokens
  }
)

export type TokenBalances = ITokenBalance & {
  symbol: string
  usdValue: BN
  assetDecimals: number
}

export const alephZeroWalletSelectors = {
  address,
  balance,
  tokensBalances,
  status,
  tokenBalance,
  balanceLoading
}
export default alephZeroWalletSelectors
