import { actions } from '@store/reducers/stats'
import { actions as poolsActions } from '@store/reducers/pools'
import { networkType } from '@store/selectors/connection'
import { tokens } from '@store/selectors/pools'
import { getFullSnap, getTokenMetadata } from '@utils/utils'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { FungibleToken } from '@invariant-labs/alph-sdk'

export function* getStats(): Generator {
  try {
    const currentNetwork = yield* select(networkType)
    const fungibleToken = FungibleToken.load()

    const fullSnap = yield* call(getFullSnap, currentNetwork.toLowerCase())

    yield* put(actions.setCurrentStats(fullSnap))

    const allTokens = yield* select(tokens)

    const unknownTokens = new Set<string>()

    fullSnap.poolsData.forEach(({ tokenX, tokenY }) => {
      if (!allTokens[tokenX]) {
        unknownTokens.add(tokenX)
      }

      if (!allTokens[tokenY]) {
        unknownTokens.add(tokenY)
      }
    })

    const unknownTokensData = yield* call(getTokenMetadata, [...unknownTokens], fungibleToken)
    yield* put(poolsActions.addTokens(unknownTokensData))
  } catch (error) {
    console.log(error)
  }
}

export function* statsHandler(): Generator {
  yield* takeEvery(actions.getCurrentStats, getStats)
}
