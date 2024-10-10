import {
  calculatePriceImpact,
  calculateSqrtPriceAfterSlippage,
  simulateInvariantSwap,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  PERCENTAGE_SCALE,
  SqrtPrice,
  Percentage,
  Invariant,
  TokenAmount
} from '@invariant-labs/alph-sdk'
import { PayloadAction } from '@reduxjs/toolkit'
import { U128MAX } from '@store/consts/static'
import {
  calculateAmountInWithSlippage,
  createLoaderKey,
  deserializeTickmap,
  ensureError,
  findPairs,
  isErrorMessage,
  isTransactionSuccess,
  poolKeyToString,
  printBigint
} from '@utils/utils'
import { actions as poolActions } from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as positionsActions } from '@store/reducers/positions'
import { Simulate, Swap, actions } from '@store/reducers/swap'
import { invariantAddress } from '@store/selectors/connection'
import { poolTicks, pools, tickMaps } from '@store/selectors/pools'
import { signer, swapTokens } from '@store/selectors/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery } from 'typed-redux-saga'
import { fetchBalances } from './wallet'
import { handleRpcError } from './connection'

export function* handleSwap(action: PayloadAction<Omit<Swap, 'txid'>>): Generator {
  const {
    poolKey,
    tokenFrom,
    slippage,
    amountIn,
    amountOut,
    byAmountIn,
    estimatedPriceAfterSwap,
    tokenTo
  } = action.payload

  if (!poolKey) {
    return
  }

  const loaderSwappingTokens = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Exchanging tokens...',
        variant: 'pending',
        persist: true,
        key: loaderSwappingTokens
      })
    )

    const walletSigner = yield* select(signer)

    if (!walletSigner) {
      return yield* put(
        snackbarsActions.add({
          message: 'Connect wallet to create position.',
          variant: 'error',
          persist: false
        })
      )
    }

    const allTokens = yield* select(swapTokens)
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(Invariant.load, invAddress)

    const xToY = tokenFrom === poolKey.tokenX

    const sqrtPriceLimit = calculateSqrtPriceAfterSlippage(
      estimatedPriceAfterSwap as SqrtPrice,
      slippage as Percentage,
      !xToY
    )
    const calculatedAmountIn = slippage
      ? calculateAmountInWithSlippage(amountOut, sqrtPriceLimit, xToY, poolKey.feeTier.fee)
      : amountIn

    const balance = allTokens[tokenFrom].balance ?? 0n
    const amountInWithBalance = balance > calculatedAmountIn ? calculatedAmountIn : balance

    const swapTxId = yield* call(
      [invariant, invariant.swapWithSlippage],
      walletSigner,
      poolKey,
      xToY,
      (byAmountIn ? amountIn : amountOut) as TokenAmount,
      byAmountIn,
      estimatedPriceAfterSwap as SqrtPrice,
      slippage as Percentage,
      amountInWithBalance as TokenAmount
    )

    const result = yield* call(isTransactionSuccess, swapTxId)
    if (!result) {
      throw new Error('Transaction failed')
    }

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))

    yield put(
      snackbarsActions.add({
        message: 'Tokens exchanged.',
        variant: 'success',
        persist: false,
        txid: swapTxId
      })
    )

    yield* call(fetchBalances, [poolKey.tokenX, poolKey.tokenY])

    yield put(actions.setSwapSuccess(true))

    yield put(
      poolActions.getAllPoolsForPairData({
        first: tokenFrom,
        second: tokenTo
      })
    )

    yield put(
      positionsActions.getCurrentPlotTicks({
        poolKey,
        isXtoY: xToY
      })
    )
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    yield put(actions.setSwapSuccess(false))

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))

    if (isErrorMessage(error.message)) {
      yield put(
        snackbarsActions.add({
          message: error.message,
          variant: 'error',
          persist: false
        })
      )
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Tokens exchange failed. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }

    yield put(
      poolActions.getAllPoolsForPairData({
        first: tokenFrom,
        second: tokenTo
      })
    )
  }
}

export enum SwapError {
  InsufficientLiquidity,
  AmountIsZero,
  NoRouteFound,
  MaxSwapStepsReached,
  StateOutdated,
  Unknown
}

export function* handleGetSimulateResult(action: PayloadAction<Simulate>) {
  try {
    const allPools = yield* select(pools)
    const allTickmaps = yield* select(tickMaps)
    const allTicks = yield* select(poolTicks)

    const { fromToken, toToken, amount, byAmountIn } = action.payload

    if (amount === 0n) {
      yield put(
        actions.setSimulateResult({
          poolKey: null,
          amountOut: 0n,
          priceImpact: 0,
          targetSqrtPrice: 0n,
          fee: 0n,
          errors: [SwapError.AmountIsZero]
        })
      )
      return
    }

    const filteredPools = findPairs(
      fromToken.toString(),
      toToken.toString(),
      Object.values(allPools)
    )
    if (!filteredPools) {
      yield put(
        actions.setSimulateResult({
          poolKey: null,
          amountOut: 0n,
          priceImpact: 0,
          targetSqrtPrice: 0n,
          fee: 0n,
          errors: [SwapError.NoRouteFound]
        })
      )
      return
    }

    let poolKey = null
    let amountOut = byAmountIn ? 0n : U128MAX
    let insufficientLiquidityAmountOut = byAmountIn ? 0n : U128MAX
    let priceImpact = 0
    let targetSqrtPrice = 0n
    let fee = 0n

    let swapPossible = false

    const errors = []

    for (const pool of filteredPools) {
      const xToY = fromToken.toString() === pool.poolKey.tokenX

      try {
        const newPool = { ...allPools[poolKeyToString(pool.poolKey)] }
        const result = simulateInvariantSwap(
          deserializeTickmap(allTickmaps[poolKeyToString(pool.poolKey)]),
          newPool,
          allTicks[poolKeyToString(pool.poolKey)],
          xToY,
          amount as TokenAmount,
          byAmountIn,
          xToY ? MIN_SQRT_PRICE : MAX_SQRT_PRICE
        )

        if (result.swapStepLimitReached || result.insufficientLiquidity) {
          if (
            byAmountIn
              ? result.amountOut > insufficientLiquidityAmountOut
              : result.amountIn > insufficientLiquidityAmountOut
          ) {
            insufficientLiquidityAmountOut = byAmountIn ? result.amountOut : result.amountIn
            fee = pool.poolKey.feeTier.fee
            priceImpact = 1
            errors.push(SwapError.MaxSwapStepsReached)
          }

          continue
        }

        if (result.stateOutdated) {
          errors.push(SwapError.StateOutdated)
          continue
        }

        if (result.amountOut === 0n) {
          errors.push(SwapError.AmountIsZero)
          continue
        }

        if (byAmountIn ? result.amountOut > amountOut : result.amountIn < amountOut) {
          swapPossible = true
          amountOut = byAmountIn ? result.amountOut : result.amountIn
          poolKey = pool.poolKey
          priceImpact = +printBigint(
            calculatePriceImpact(pool.sqrtPrice, result.targetSqrtPrice),
            PERCENTAGE_SCALE
          )
          targetSqrtPrice = result.targetSqrtPrice
        }
      } catch (e) {
        errors.push(SwapError.Unknown)

        yield* call(handleRpcError, (e as Error).message)
      }
    }

    const validatedAmountOut = swapPossible ? amountOut : insufficientLiquidityAmountOut

    yield put(
      actions.setSimulateResult({
        poolKey: swapPossible ? poolKey : null,
        amountOut: validatedAmountOut,
        priceImpact: swapPossible ? priceImpact : 1,
        targetSqrtPrice,
        fee,
        errors
      })
    )
  } catch (error) {
    console.log(error)

    yield* call(handleRpcError, (error as Error).message)
  }
}

export function* swapHandler(): Generator {
  yield* takeEvery(actions.swap, handleSwap)
}

export function* getSimulateResultHandler(): Generator {
  yield* takeEvery(actions.getSimulateResult, handleGetSimulateResult)
}

export function* swapSaga(): Generator {
  yield all([swapHandler, getSimulateResultHandler].map(spawn))
}
