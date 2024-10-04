import { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import { Swap } from '@components/Swap/Swap'
import { commonTokensForNetworks, DEFAULT_SWAP_SLIPPAGE } from '@store/consts/static'
import { TokenPriceData } from '@store/consts/types'
import {
  addNewTokenToLocalStorage,
  getCoinGeckoTokenPrice,
  getMockedTokenPrice,
  getNewTokenOrThrow,
  tickerToAddress
} from '@utils/utils'
import { actions as poolsActions } from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Simulate, actions } from '@store/reducers/swap'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { networkType } from '@store/selectors/connection'
import {
  isLoadingLatestPoolsForTransaction,
  poolsArraySortedByFees,
  tickMaps
} from '@store/selectors/pools'
import { simulateResult, swap as swapPool } from '@store/selectors/swap'
import { address, balance, balanceLoading, status, swapTokens } from '@store/selectors/wallet'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { VariantType } from 'notistack'
import { useConnect } from '@alephium/web3-react'
import { FungibleToken } from '@invariant-labs/alph-sdk'

type Props = {
  initialTokenFrom: string
  initialTokenTo: string
}

export const WrappedSwap = ({ initialTokenFrom, initialTokenTo }: Props) => {
  const dispatch = useDispatch()

  const walletAddress = useSelector(address)
  const walletStatus = useSelector(status)
  const alphBalance = useSelector(balance)
  const swap = useSelector(swapPool)
  const tickmap = useSelector(tickMaps)
  const allPools = useSelector(poolsArraySortedByFees)
  const tokensList = useSelector(swapTokens)
  const isBalanceLoading = useSelector(balanceLoading)
  const { success, inProgress } = useSelector(swapPool)
  const isFetchingNewPool = useSelector(isLoadingLatestPoolsForTransaction)
  const network = useSelector(networkType)
  const swapSimulateResult = useSelector(simulateResult)
  const [progress, setProgress] = useState<ProgressState>('none')
  const [tokenFrom, setTokenFrom] = useState<string | null>(null)
  const [tokenTo, setTokenTo] = useState<string | null>(null)
  const { connect, disconnect } = useConnect()

  useEffect(() => {
    let timeoutId1: NodeJS.Timeout
    let timeoutId2: NodeJS.Timeout

    if (!inProgress && progress === 'progress') {
      setProgress(success ? 'approvedWithSuccess' : 'approvedWithFail')

      timeoutId1 = setTimeout(() => {
        setProgress(success ? 'success' : 'failed')
      }, 1000)

      timeoutId2 = setTimeout(() => {
        setProgress('none')
      }, 3000)
    }

    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
    }
  }, [success, inProgress])

  useEffect(() => {
    if (tokenFrom !== null && tokenTo !== null && !isFetchingNewPool) {
      dispatch(
        actions.setPair({
          tokenFrom,
          tokenTo
        })
      )
    }
  }, [isFetchingNewPool])

  const lastTokenFrom =
    tickerToAddress(network, initialTokenFrom) && initialTokenFrom !== '-'
      ? tickerToAddress(network, initialTokenFrom)
      : localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${network}`)

  const lastTokenTo =
    tickerToAddress(network, initialTokenTo) && initialTokenTo !== '-'
      ? tickerToAddress(network, initialTokenTo)
      : localStorage.getItem(`INVARIANT_LAST_TOKEN_TO_${network}`)

  useEffect(() => {
    const tokens = []

    if (lastTokenFrom && !tokensList[lastTokenFrom]) {
      tokens.push(lastTokenFrom)
    }

    if (lastTokenTo && !tokensList[lastTokenTo]) {
      tokens.push(lastTokenTo)
    }

    if (tokens.length) {
      dispatch(poolsActions.getTokens(tokens))
    }
  }, [])

  const addTokenHandler = async (address: string) => {
    const fungibleToken = FungibleToken.load()

    if (!tokensList[address]) {
      getNewTokenOrThrow(address, fungibleToken, walletAddress)
        .then(data => {
          dispatch(poolsActions.addTokens(data))
          dispatch(walletActions.getBalances(Object.keys(data)))
          addNewTokenToLocalStorage(address, network)
          dispatch(
            snackbarsActions.add({
              message: 'Token added.',
              variant: 'success',
              persist: false
            })
          )
        })
        .catch(() => {
          dispatch(
            snackbarsActions.add({
              message: 'Token add failed.',
              variant: 'error',
              persist: false
            })
          )
        })
    } else {
      dispatch(
        snackbarsActions.add({
          message: 'Token already in list.',
          variant: 'info',
          persist: false
        })
      )
    }
  }

  const initialHideUnknownTokensValue =
    localStorage.getItem('HIDE_UNKNOWN_TOKENS') === 'true' ||
    localStorage.getItem('HIDE_UNKNOWN_TOKENS') === null

  const setHideUnknownTokensValue = (val: boolean) => {
    localStorage.setItem('HIDE_UNKNOWN_TOKENS', val ? 'true' : 'false')
  }

  const [tokenFromPriceData, setTokenFromPriceData] = useState<TokenPriceData | undefined>(
    undefined
  )
  const [priceFromLoading, setPriceFromLoading] = useState(false)
  useEffect(() => {
    if (tokenFrom === null) {
      return
    }

    const id = tokensList[tokenFrom.toString()]?.coingeckoId || ''

    if (id.length) {
      setPriceFromLoading(true)
      getCoinGeckoTokenPrice(id)
        .then(data => setTokenFromPriceData({ price: data ?? 0 }))
        .catch(() =>
          setTokenFromPriceData(
            getMockedTokenPrice(tokensList[tokenFrom.toString()].symbol, network)
          )
        )
        .finally(() => setPriceFromLoading(false))
    } else {
      setTokenFromPriceData(undefined)
    }
  }, [tokenFrom])

  const [tokenToPriceData, setTokenToPriceData] = useState<TokenPriceData | undefined>(undefined)
  const [priceToLoading, setPriceToLoading] = useState(false)
  useEffect(() => {
    if (tokenTo === null) {
      return
    }

    const id = tokensList[tokenTo.toString()]?.coingeckoId || ''
    if (id.length) {
      setPriceToLoading(true)
      getCoinGeckoTokenPrice(id)
        .then(data => setTokenToPriceData({ price: data ?? 0 }))
        .catch(() =>
          setTokenToPriceData(getMockedTokenPrice(tokensList[tokenTo.toString()].symbol, network))
        )
        .finally(() => setPriceToLoading(false))
    } else {
      setTokenToPriceData(undefined)
    }
  }, [tokenTo])

  const initialSlippage = localStorage.getItem('INVARIANT_SWAP_SLIPPAGE') ?? DEFAULT_SWAP_SLIPPAGE

  const onSlippageChange = (slippage: string) => {
    localStorage.setItem('INVARIANT_SWAP_SLIPPAGE', slippage)
  }

  const onRefresh = (tokenFromAddress: string | null, tokenToAddress: string | null) => {
    if (tokenFromAddress === null || tokenToAddress == null) {
      return
    }

    if (walletStatus === Status.Initialized) {
      dispatch(walletActions.getBalances([tokenFromAddress, tokenToAddress]))
    }

    dispatch(
      poolsActions.getAllPoolsForPairData({
        first: tokenFromAddress,
        second: tokenToAddress
      })
    )

    if (tokenTo === null || tokenFrom === null) {
      return
    }

    const idTo = tokensList[tokenTo].coingeckoId ?? ''

    if (idTo.length) {
      setPriceToLoading(true)
      getCoinGeckoTokenPrice(idTo)
        .then(data => setTokenToPriceData({ price: data ?? 0 }))
        .catch(() =>
          setTokenToPriceData(getMockedTokenPrice(tokensList[tokenTo.toString()].symbol, network))
        )
        .finally(() => setPriceToLoading(false))
    } else {
      setTokenToPriceData(undefined)
    }

    const idFrom = tokensList[tokenFrom].coingeckoId ?? ''

    if (idFrom.length) {
      setPriceFromLoading(true)
      getCoinGeckoTokenPrice(idFrom)
        .then(data => setTokenFromPriceData({ price: data ?? 0 }))
        .catch(() =>
          setTokenFromPriceData(
            getMockedTokenPrice(tokensList[tokenFrom.toString()].symbol, network)
          )
        )
        .finally(() => setPriceFromLoading(false))
    } else {
      setTokenFromPriceData(undefined)
    }
  }

  const simulateSwap = (simulate: Simulate) => {
    dispatch(actions.getSimulateResult(simulate))
  }

  const copyTokenAddressHandler = (message: string, variant: VariantType) => {
    dispatch(
      snackbarsActions.add({
        message,
        variant,
        persist: false
      })
    )
  }

  return (
    <Swap
      isFetchingNewPool={isFetchingNewPool}
      onRefresh={onRefresh}
      onSwap={(
        poolKey,
        slippage,
        estimatedPriceAfterSwap,
        tokenFrom,
        tokenTo,
        amountIn,
        amountOut,
        byAmountIn
      ) => {
        setProgress('progress')
        dispatch(
          actions.swap({
            poolKey,
            slippage,
            estimatedPriceAfterSwap,
            tokenFrom,
            tokenTo,
            amountIn,
            amountOut,
            byAmountIn
          })
        )
      }}
      onSetPair={(tokenFrom, tokenTo) => {
        setTokenFrom(tokenFrom)
        setTokenTo(tokenTo)

        if (tokenFrom !== null) {
          localStorage.setItem(`INVARIANT_LAST_TOKEN_FROM_${network}`, tokenFrom.toString())
        }

        if (tokenTo !== null) {
          localStorage.setItem(`INVARIANT_LAST_TOKEN_TO_${network}`, tokenTo.toString())
        }
        if (
          tokenFrom !== null &&
          tokenTo !== null &&
          tokenFrom !== tokenTo &&
          tokenFrom !== '-' &&
          tokenTo !== '-'
        ) {
          dispatch(
            poolsActions.getAllPoolsForPairData({
              first: tokenFrom,
              second: tokenTo
            })
          )
        }
      }}
      onConnectWallet={async () => {
        await connect()
      }}
      onDisconnectWallet={async () => {
        await disconnect()
      }}
      walletStatus={walletStatus}
      tokens={tokensList}
      pools={allPools}
      swapData={swap}
      progress={progress}
      isWaitingForNewPool={isFetchingNewPool}
      tickmap={tickmap}
      initialTokenFrom={lastTokenFrom}
      initialTokenTo={lastTokenTo}
      handleAddToken={addTokenHandler}
      commonTokens={commonTokensForNetworks[network]}
      initialHideUnknownTokensValue={initialHideUnknownTokensValue}
      onHideUnknownTokensChange={setHideUnknownTokensValue}
      tokenFromPriceData={tokenFromPriceData}
      tokenToPriceData={tokenToPriceData}
      priceFromLoading={priceFromLoading || isBalanceLoading}
      priceToLoading={priceToLoading || isBalanceLoading}
      onSlippageChange={onSlippageChange}
      initialSlippage={initialSlippage}
      isBalanceLoading={isBalanceLoading}
      simulateResult={swapSimulateResult}
      simulateSwap={simulateSwap}
      copyTokenAddressHandler={copyTokenAddressHandler}
      network={network}
      alphBalance={alphBalance}
    />
  )
}

export default WrappedSwap
