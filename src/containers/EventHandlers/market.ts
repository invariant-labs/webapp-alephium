import { getNetworkTokensList, getTokenDataByAddresses } from '@utils/utils'
import { actions } from '@store/reducers/pools'
import { networkType, status } from '@store/selectors/connection'
import { poolsArraySortedByFees } from '@store/selectors/pools'
import { swap } from '@store/selectors/swap'
import { address } from '@store/selectors/wallet'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FungibleToken } from '@invariant-labs/alph-sdk'

const MarketEvents = () => {
  const dispatch = useDispatch()
  const network = useSelector(networkType)
  const networkStatus = useSelector(status)
  const { tokenFrom, tokenTo } = useSelector(swap)
  const allPools = useSelector(poolsArraySortedByFees)
  const walletAddress = useSelector(address)

  useEffect(() => {
    const connectEvents = async () => {
      const fungibleToken = FungibleToken.load()
      let tokens = getNetworkTokensList(network)

      const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${network}`)
      const currentList: string[] =
        currentListStr !== null
          ? JSON.parse(currentListStr)
              .filter((address: string) => !tokens[address])
              .map((address: string) => address)
          : []

      getTokenDataByAddresses(currentList, fungibleToken, walletAddress)
        .then(data => {
          tokens = {
            ...tokens,
            ...data
          }
        })
        .finally(() => {
          dispatch(actions.addTokens(tokens))
        })
    }

    connectEvents()
  }, [dispatch, networkStatus, walletAddress])

  useEffect(() => {
    if (tokenFrom && tokenTo) {
      dispatch(actions.getTicksAndTickMaps({ tokenFrom, tokenTo, allPools }))
    }
  }, [tokenFrom, tokenTo])

  return null
}

export default MarketEvents
