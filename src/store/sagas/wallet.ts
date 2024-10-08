import { ALPH_TOKEN_ID, SignerProvider } from '@alephium/web3'
import { FungibleToken, TokenAmount } from '@invariant-labs/alph-sdk'
import { balanceOf } from '@invariant-labs/alph-sdk/dist/src/utils'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  FAUCET_SAFE_TRANSACTION_FEE,
  getFaucetTokenList,
  TokenAirdropAmount
} from '@store/consts/static'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as positionsActions } from '@store/reducers/positions'
import { Status, actions } from '@store/reducers/wallet'
import { networkType } from '@store/selectors/connection'
import { tokens } from '@store/selectors/pools'
import { positionsList } from '@store/selectors/positions'
import { address, balance, signer, status } from '@store/selectors/wallet'
import { createLoaderKey, getTokenBalances } from '@utils/utils'
import { closeSnackbar } from 'notistack'
import {
  all,
  call,
  put,
  SagaGenerator,
  select,
  spawn,
  takeLatest,
  takeLeading
} from 'typed-redux-saga'
import { handleRpcError } from './connection'

export function* getBalance(walletAddress: string): SagaGenerator<TokenAmount> {
  return yield* call(balanceOf, ALPH_TOKEN_ID, walletAddress)
}

export function* handleAirdrop(): Generator {
  const walletSigner = yield* select(signer)
  const walletBalance = yield* select(balance)

  if (!walletSigner) {
    return yield* put(
      snackbarsActions.add({
        message: 'Connect wallet to claim the faucet.',
        variant: 'error',
        persist: false
      })
    )
  }

  if (FAUCET_SAFE_TRANSACTION_FEE > walletBalance) {
    return yield* put(
      snackbarsActions.add({
        message: 'Insufficient ALPH balance.',
        variant: 'error',
        persist: false
      })
    )
  }

  const loaderAirdrop = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Airdrop in progress...',
        variant: 'pending',
        persist: true,
        key: loaderAirdrop
      })
    )

    const network = yield* select(networkType)

    const fungibleToken = FungibleToken.load()

    const faucetTokenList = getFaucetTokenList(network)

    const airdropTxId = yield* call(
      [fungibleToken, fungibleToken.airdrop],
      walletSigner,
      TokenAirdropAmount.BTC as TokenAmount,
      faucetTokenList.BTC,
      TokenAirdropAmount.ETH as TokenAmount,
      faucetTokenList.ETH,
      TokenAirdropAmount.USDC as TokenAmount,
      faucetTokenList.USDC
    )

    closeSnackbar(loaderAirdrop)
    yield put(snackbarsActions.remove(loaderAirdrop))

    const tokenNames = Object.keys(faucetTokenList).join(', ')

    yield* put(
      snackbarsActions.add({
        message: `Airdropped ${tokenNames} tokens`,
        variant: 'success',
        persist: false,
        txid: airdropTxId
      })
    )

    yield* call(fetchBalances, [...Object.values(faucetTokenList)])
  } catch (error) {
    console.log(error)

    closeSnackbar(loaderAirdrop)
    yield put(snackbarsActions.remove(loaderAirdrop))

    yield* call(handleRpcError, (error as Error).message)
  }
}

export function* init(isEagerConnect: boolean, signer: SignerProvider): Generator {
  try {
    yield* put(actions.setStatus(Status.Init))

    if (isEagerConnect) {
      yield* put(
        snackbarsActions.add({
          message: 'Wallet reconnected.',
          variant: 'success',
          persist: false
        })
      )
    } else {
      yield* put(
        snackbarsActions.add({
          message: 'Wallet connected.',
          variant: 'success',
          persist: false
        })
      )
    }

    yield* put(actions.setSigner(signer))
    const account = yield* call([signer, signer.getSelectedAccount])
    yield* put(actions.setAddress(account.address))

    const allTokens = yield* select(tokens)
    yield* call(fetchBalances, Object.keys(allTokens))

    const balance = yield* call(balanceOf, ALPH_TOKEN_ID, account.address)
    yield* put(actions.setBalance(balance))

    yield* put(actions.setStatus(Status.Initialized))
  } catch (error) {
    console.log(error)

    yield* call(handleRpcError, (error as Error).message)
  }
}

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function* handleConnect(
  action: PayloadAction<{
    isEagerConnect: boolean
    signer: SignerProvider
  }>
): Generator {
  const walletStatus = yield* select(status)
  if (walletStatus === Status.Initialized) {
    yield* put(
      snackbarsActions.add({
        message: 'Wallet already connected.',
        variant: 'info',
        persist: false
      })
    )
    return
  }
  const { isEagerConnect, signer } = action.payload
  yield* call(init, isEagerConnect, signer)
}

export function* handleDisconnect(): Generator {
  try {
    const { loadedPages } = yield* select(positionsList)

    yield* put(actions.resetState())

    yield* put(
      snackbarsActions.add({
        message: 'Wallet disconnected.',
        variant: 'success',
        persist: false
      })
    )

    yield* put(positionsActions.setPositionsList([]))
    yield* put(positionsActions.setPositionsListLength(0n))
    yield* put(
      positionsActions.setPositionsListLoadedStatus({
        indexes: Object.keys(loadedPages).map(key => Number(key)),
        isLoaded: false
      })
    )

    yield* put(
      positionsActions.setCurrentPositionTicks({
        lowerTick: undefined,
        upperTick: undefined
      })
    )
  } catch (error) {
    console.log(error)

    yield* call(handleRpcError, (error as Error).message)
  }
}

export function* fetchBalances(tokens: string[]): Generator {
  const walletAddress = yield* select(address)
  const fungibleToken = FungibleToken.load()

  if (!walletAddress) {
    return
  }

  yield* put(actions.setIsBalanceLoading(true))

  const { balance, tokenBalances } = yield* all({
    balance: call(getBalance, walletAddress),
    tokenBalances: call(getTokenBalances, tokens, fungibleToken, walletAddress)
  })

  yield* put(actions.setBalance(BigInt(balance)))

  yield* put(
    actions.addTokenBalances(
      tokenBalances.map(([address, balance]) => {
        return {
          address,
          balance
        }
      })
    )
  )

  yield* put(actions.setIsBalanceLoading(false))
}

export function* handleGetBalances(action: PayloadAction<string[]>): Generator {
  yield* call(fetchBalances, action.payload)
}

export function* connectHandler(): Generator {
  yield takeLatest(actions.connect, handleConnect)
}

export function* disconnectHandler(): Generator {
  yield takeLatest(actions.disconnect, handleDisconnect)
}

export function* airdropSaga(): Generator {
  yield takeLeading(actions.airdrop, handleAirdrop)
}

export function* getBalancesHandler(): Generator {
  yield takeLeading(actions.getBalances, handleGetBalances)
}

export function* walletSaga(): Generator {
  yield all([airdropSaga, connectHandler, disconnectHandler, getBalancesHandler].map(spawn))
}
