import {
  Pool,
  Position,
  Invariant,
  calculateTokenAmountsWithSlippage,
  SqrtPrice,
  Liquidity,
  Percentage,
  TokenAmount,
  ALPH_TOKEN_ID
} from '@invariant-labs/alph-sdk'
import { PayloadAction } from '@reduxjs/toolkit'
import { EMPTY_POSITION, POSITIONS_PER_QUERY } from '@store/consts/static'
import {
  createLiquidityPlot,
  createLoaderKey,
  createPlaceholderLiquidityPlot,
  ensureError,
  getLiquidityTicksByPositionsList,
  isErrorMessage,
  isTransactionSuccess,
  poolKeyToString
} from '@utils/utils'
import { FetchTicksAndTickMaps, ListType, actions as poolsActions } from '@store/reducers/pools'
import {
  ClosePositionData,
  GetCurrentTicksData,
  GetPositionTicks,
  HandleClaimFee,
  InitPositionData,
  actions
} from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as walletActions } from '@store/reducers/wallet'
import { invariantAddress } from '@store/selectors/connection'
import { poolsArraySortedByFees, poolTicks, tickMaps, tokens } from '@store/selectors/pools'
import { address, poolTokens, poolTokensWithInitPool, signer } from '@store/selectors/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, fork, join, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { fetchTicksAndTickMaps, fetchTokens } from './pools'
import { fetchBalances } from './wallet'
import { positionsList } from '@store/selectors/positions'
import { handleRpcError } from './connection'

function* handleInitPosition(action: PayloadAction<InitPositionData>): Generator {
  const {
    poolKeyData,
    lowerTick,
    upperTick,
    spotSqrtPrice,
    liquidityDelta,
    initPool,
    slippageTolerance
  } = action.payload
  const { tokenX, tokenY, feeTier } = poolKeyData

  const loaderCreatePosition = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating position...',
        variant: 'pending',
        persist: true,
        key: loaderCreatePosition
      })
    )

    const walletAddress = yield* select(address)
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

    const allTokens = yield* select(initPool ? poolTokensWithInitPool : poolTokens)
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(Invariant.load, invAddress)

    const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      feeTier.tickSpacing,
      spotSqrtPrice as SqrtPrice,
      liquidityDelta as Liquidity,
      lowerTick,
      upperTick,
      slippageTolerance as Percentage,
      true
    )

    const xBalance = allTokens[tokenX].balance
    const yBalance = allTokens[tokenY].balance
    const xAmount = xBalance > xAmountWithSlippage ? xAmountWithSlippage : xBalance
    const yAmount = yBalance > yAmountWithSlippage ? yAmountWithSlippage : yBalance

    if (initPool) {
      const createPoolTxId = yield* call(
        [invariant, invariant.createPool],
        walletSigner,
        poolKeyData,
        spotSqrtPrice as SqrtPrice
      )

      const result = yield* call(isTransactionSuccess, createPoolTxId)
      if (!result) {
        throw new Error('Transaction failed')
      }

      yield* put(
        snackbarsActions.add({
          message: `Pool created.`,
          variant: 'success',
          persist: false,
          txid: createPoolTxId
        })
      )
    }

    const createPositionTxId = yield* call(
      [invariant, invariant.createPosition],
      walletSigner,
      poolKeyData,
      lowerTick,
      upperTick,
      liquidityDelta as Liquidity,
      xAmount as TokenAmount,
      yAmount as TokenAmount,
      spotSqrtPrice as SqrtPrice,
      slippageTolerance as Percentage
    )

    const result = yield* call(isTransactionSuccess, createPositionTxId)
    if (!result) {
      throw new Error('Transaction failed')
    }

    yield* put(actions.setInitPositionSuccess(true))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

    yield* put(
      snackbarsActions.add({
        message: `Position created.`,
        variant: 'success',
        persist: false,
        txid: createPositionTxId
      })
    )

    yield put(walletActions.getBalances([tokenX, tokenY]))

    const { length } = yield* select(positionsList)
    const position = yield* call([invariant, invariant.getPosition], walletAddress, length)
    yield* put(actions.addPosition(position))

    yield* put(poolsActions.getPoolKeys())
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
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
          message: 'Failed to create position. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }
}

export function* handleGetCurrentPositionTicks(action: PayloadAction<GetPositionTicks>) {
  const { poolKey, lowerTickIndex, upperTickIndex } = action.payload

  const invAddress = yield* select(invariantAddress)
  const invariant = yield* call(Invariant.load, invAddress)

  const [lowerTick, upperTick] = yield* all([
    call([invariant, invariant.getTick], poolKey, lowerTickIndex),
    call([invariant, invariant.getTick], poolKey, upperTickIndex)
  ])

  yield put(
    actions.setCurrentPositionTicks({
      lowerTick,
      upperTick
    })
  )
}

export function* handleGetCurrentPlotTicks(action: PayloadAction<GetCurrentTicksData>): Generator {
  const { poolKey, isXtoY, fetchTicksAndTickmap } = action.payload
  let allTickmaps = yield* select(tickMaps)
  let allTicks = yield* select(poolTicks)
  const allTokens = yield* select(tokens)
  const allPools = yield* select(poolsArraySortedByFees)

  const xDecimal = allTokens[poolKey.tokenX].decimals
  const yDecimal = allTokens[poolKey.tokenY].decimals

  try {
    if (!allTickmaps[poolKeyToString(poolKey)] || fetchTicksAndTickmap) {
      const fetchTicksAndTickMapsAction: PayloadAction<FetchTicksAndTickMaps> = {
        type: poolsActions.getTicksAndTickMaps.type,
        payload: {
          tokenFrom: allTokens[poolKey.tokenX].address,
          tokenTo: allTokens[poolKey.tokenY].address,
          allPools,
          poolKey
        }
      }

      const fetchTask = yield* fork(fetchTicksAndTickMaps, fetchTicksAndTickMapsAction)

      yield* join(fetchTask)
      allTickmaps = yield* select(tickMaps)
      allTicks = yield* select(poolTicks)
    }

    if (!allTickmaps[poolKeyToString(poolKey)]) {
      const data = createPlaceholderLiquidityPlot(
        action.payload.isXtoY,
        0,
        poolKey.feeTier.tickSpacing,
        xDecimal,
        yDecimal
      )
      yield* put(actions.setPlotTicks({ allPlotTicks: data, userPlotTicks: data }))
      return
    }

    if (!allTicks[poolKeyToString(poolKey)]) {
      const data = createPlaceholderLiquidityPlot(
        action.payload.isXtoY,
        0,
        poolKey.feeTier.tickSpacing,
        xDecimal,
        yDecimal
      )
      yield* put(actions.setPlotTicks({ allPlotTicks: data, userPlotTicks: data }))
      return
    }

    const allPlotTicks =
      allTicks[poolKeyToString(poolKey)].length === 0
        ? createPlaceholderLiquidityPlot(
            action.payload.isXtoY,
            0,
            poolKey.feeTier.tickSpacing,
            xDecimal,
            yDecimal
          )
        : createLiquidityPlot(
            [...allTicks[poolKeyToString(poolKey)]],
            poolKey.feeTier.tickSpacing,
            isXtoY,
            xDecimal,
            yDecimal
          )

    yield* put(actions.getRemainingPositions({ setLoaded: false }))

    const { list } = yield* select(positionsList)
    const userRawTicks = getLiquidityTicksByPositionsList(poolKey, list)

    const userPlotTicks =
      userRawTicks.length === 0
        ? createPlaceholderLiquidityPlot(
            action.payload.isXtoY,
            0,
            poolKey.feeTier.tickSpacing,
            xDecimal,
            yDecimal
          )
        : createLiquidityPlot(userRawTicks, poolKey.feeTier.tickSpacing, isXtoY, xDecimal, yDecimal)

    yield* put(actions.setPlotTicks({ allPlotTicks, userPlotTicks }))
  } catch (error) {
    console.log(error)
    const data = createPlaceholderLiquidityPlot(
      action.payload.isXtoY,
      10,
      poolKey.feeTier.tickSpacing,
      xDecimal,
      yDecimal
    )
    yield* put(actions.setErrorPlotTicks(data))

    yield* call(handleRpcError, (error as Error).message)
  }
}

export function* handleClaimFee(action: PayloadAction<HandleClaimFee>) {
  const { index, addressTokenX, addressTokenY } = action.payload

  const loaderKey = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Claiming fee...',
        variant: 'pending',
        persist: true,
        key: loaderKey
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

    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(Invariant.load, invAddress)

    const claimTxId = yield* call([invariant, invariant.claimFee], walletSigner, index)

    const result = yield* call(isTransactionSuccess, claimTxId)
    if (!result) {
      throw new Error('Transaction failed')
    }

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Fee claimed.',
        variant: 'success',
        persist: false,
        txid: claimTxId
      })
    )

    yield put(actions.getSinglePosition(index))

    yield* call(fetchBalances, [addressTokenX === ALPH_TOKEN_ID ? addressTokenY : addressTokenX])
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

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
          message: 'Failed to claim fee. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }
}

export function* handleGetSinglePosition(action: PayloadAction<bigint>) {
  try {
    const walletAddress = yield* select(address)
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(Invariant.load, invAddress)
    const [position, pool, lowerTick, upperTick] = yield* call(
      [invariant, invariant.getPositionWithAssociates],
      walletAddress,
      action.payload
    )
    yield* put(
      actions.setSinglePosition({
        index: action.payload,
        position
      })
    )
    yield put(
      actions.setCurrentPositionTicks({
        lowerTick,
        upperTick
      })
    )
    yield* put(
      poolsActions.addPoolsForList({
        data: [pool],
        listType: ListType.POSITIONS
      })
    )
  } catch (e) {
    console.log(e)
    yield* put(actions.setCurrentPositionTickLoading(false))
    yield* put(actions.setPositionsList([]))

    yield* call(handleRpcError, (e as Error).message)
  }
}

export function* handleClosePosition(action: PayloadAction<ClosePositionData>) {
  const { addressTokenX, addressTokenY, onSuccess, positionIndex } = action.payload

  const loaderKey = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Closing position...',
        variant: 'pending',
        persist: true,
        key: loaderKey
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

    const allPositions = yield* select(positionsList)
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(Invariant.load, invAddress)

    const getPositionsListPagePayload: PayloadAction<{
      index: number
      refresh: boolean
    }> = {
      type: actions.getPositionsListPage.type,
      payload: {
        index: Math.floor(Number(allPositions.length) / POSITIONS_PER_QUERY),
        refresh: false
      }
    }
    const fetchTask = yield* fork(handleGetPositionsListPage, getPositionsListPagePayload)
    yield* join(fetchTask)

    const removePositionTxId = yield* call(
      [invariant, invariant.removePosition],
      walletSigner,
      positionIndex
    )

    const result = yield* call(isTransactionSuccess, removePositionTxId)
    if (!result) {
      throw new Error('Transaction failed')
    }

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Position closed.',
        variant: 'success',
        persist: false,
        txid: removePositionTxId
      })
    )

    yield* put(actions.removePosition(positionIndex))
    onSuccess()

    yield* call(fetchBalances, [addressTokenX, addressTokenY])
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

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
          message: 'Failed to close position. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }

  yield* put(actions.setClosePositionNotInProgress())
}

export function* handleGetRemainingPositions(
  action: PayloadAction<{ setLoaded: boolean }>
): Generator {
  const walletAddress = yield* select(address)
  const { length, list, loadedPages } = yield* select(positionsList)

  if (!walletAddress) {
    return
  }

  try {
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(Invariant.load, invAddress)

    const pages = yield* call(
      [invariant, invariant.getAllPositions],
      walletAddress,
      length,
      Object.entries(loadedPages)
        .filter(([_, isLoaded]) => isLoaded)
        .map(([index]) => Number(index)),
      BigInt(POSITIONS_PER_QUERY)
    )

    const allList = [...list]
    for (const { index, entries } of pages) {
      for (let i = 0; i < entries.length; i++) {
        allList[i + index * Number(POSITIONS_PER_QUERY)] = entries[i][0]
      }
    }

    yield* put(actions.setPositionsList(allList))
    yield* put(
      actions.setPositionsListLoadedStatus({
        indexes: pages.map(({ index }: { index: number }) => index),
        isLoaded: action.payload.setLoaded
      })
    )
  } catch (error) {
    console.log(error)
    yield* put(actions.setPositionsList([]))

    yield* call(handleRpcError, (error as Error).message)
  }
}

export function* handleGetPositionsListPage(
  action: PayloadAction<{ index: number; refresh: boolean }>
) {
  const { index, refresh } = action.payload

  const walletAddress = yield* select(address)
  const { length, list, loadedPages } = yield* select(positionsList)

  try {
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(Invariant.load, invAddress)

    let entries: [Position, Pool][] = []
    let positionsLength = 0n

    if (refresh) {
      yield* put(
        actions.setPositionsListLoadedStatus({
          indexes: Object.keys(loadedPages)
            .map(key => Number(key))
            .filter(keyIndex => keyIndex !== index),
          isLoaded: false
        })
      )
    }

    const poolsWithTokensToFetch = []

    if (!length || refresh) {
      const result = yield* call(
        [invariant, invariant.getPositions],
        walletAddress,
        BigInt(POSITIONS_PER_QUERY),
        BigInt(index * POSITIONS_PER_QUERY)
      )
      entries = result[0]
      positionsLength = result[1]

      const poolsWithPoolKeys = entries.map(entry => entry[1])

      yield* put(
        poolsActions.addPoolsForList({
          data: poolsWithPoolKeys,
          listType: ListType.POSITIONS
        })
      )
      poolsWithTokensToFetch.push(...poolsWithPoolKeys)

      yield* put(actions.setPositionsListLength(positionsLength))
    }

    const allList = length ? [...list] : Array(Number(positionsLength)).fill(EMPTY_POSITION)

    const isPageLoaded = loadedPages[index]

    if (!isPageLoaded || refresh) {
      if (length && !refresh) {
        const result = yield* call(
          [invariant, invariant.getPositions],
          walletAddress,
          BigInt(POSITIONS_PER_QUERY),
          BigInt(index * POSITIONS_PER_QUERY)
        )
        entries = result[0]
        positionsLength = result[1]

        const poolsWithPoolKeys = entries.map(entry => entry[1])

        yield* put(
          poolsActions.addPoolsForList({
            data: poolsWithPoolKeys,
            listType: ListType.POSITIONS
          })
        )

        poolsWithTokensToFetch.push(...poolsWithPoolKeys)
      }

      yield* call(fetchTokens, poolsWithTokensToFetch)

      for (let i = 0; i < entries.length; i++) {
        allList[i + index * POSITIONS_PER_QUERY] = entries[i][0]
      }

      allList.splice(
        entries.length + index * POSITIONS_PER_QUERY,
        POSITIONS_PER_QUERY - entries.length
      )
    }

    yield* put(actions.setPositionsList(allList))
    yield* put(actions.setPositionsListLoadedStatus({ indexes: [index], isLoaded: true }))
  } catch (error) {
    console.log(error)
    yield* put(actions.setPositionsList([]))
    yield* put(actions.setPositionsListLoadedStatus({ indexes: [index], isLoaded: true }))

    yield* call(handleRpcError, (error as Error).message)
  }
}

export function* initPositionHandler(): Generator {
  yield* takeEvery(actions.initPosition, handleInitPosition)
}

export function* getCurrentPositionTicksHandler(): Generator {
  yield* takeEvery(actions.getCurrentPositionTicks, handleGetCurrentPositionTicks)
}

export function* getCurrentPlotTicksHandler(): Generator {
  yield* takeLatest(actions.getCurrentPlotTicks, handleGetCurrentPlotTicks)
}
export function* claimFeeHandler(): Generator {
  yield* takeEvery(actions.claimFee, handleClaimFee)
}

export function* getSinglePositionHandler(): Generator {
  yield* takeEvery(actions.getSinglePosition, handleGetSinglePosition)
}

export function* closePositionHandler(): Generator {
  yield* takeEvery(actions.closePosition, handleClosePosition)
}

export function* getPositionsListPage(): Generator {
  yield* takeLatest(actions.getPositionsListPage, handleGetPositionsListPage)
}

export function* getRemainingPositions(): Generator {
  yield* takeLatest(actions.getRemainingPositions, handleGetRemainingPositions)
}

export function* positionsSaga(): Generator {
  yield all(
    [
      initPositionHandler,
      getCurrentPositionTicksHandler,
      getCurrentPlotTicksHandler,
      claimFeeHandler,
      getSinglePositionHandler,
      closePositionHandler,
      getPositionsListPage,
      getRemainingPositions
    ].map(spawn)
  )
}
