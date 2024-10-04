import { ALPH_TOKEN_ID, BTC_ID, ETH_ID, Network, USDC_ID } from '@invariant-labs/alph-sdk'
import { BestTier } from '@store/consts/types'

export const toBlur = 'global-blur'

export const blurContent = () => {
  const el = document.getElementById(toBlur)
  if (!el) return
  el.style.filter = 'blur(4px) brightness(0.4)'
}
export const unblurContent = () => {
  const el = document.getElementById(toBlur)
  if (!el) return
  el.style.filter = 'none'
}

export function bestTiersCreator(network: Network) {
  const stableTokens = {
    USDC: USDC_ID[network]
  }

  const unstableTokens = {
    BTC: BTC_ID[network],
    ETH: ETH_ID[network],
    ALPH: ALPH_TOKEN_ID
  }

  const bestTiers: BestTier[] = []

  const stableTokensValues = Object.values(stableTokens)
  for (let i = 0; i < stableTokensValues.length; i++) {
    const tokenX = stableTokensValues[i]
    for (let j = i + 1; j < stableTokensValues.length; j++) {
      const tokenY = stableTokensValues[j]

      bestTiers.push({
        tokenX,
        tokenY,
        bestTierIndex: 0
      })
    }
  }

  const unstableTokensEntries = Object.entries(unstableTokens)
  for (let i = 0; i < unstableTokensEntries.length; i++) {
    const [symbolX, tokenX] = unstableTokensEntries[i]
    for (let j = i + 1; j < unstableTokensEntries.length; j++) {
      const [symbolY, tokenY] = unstableTokensEntries[j]

      if (symbolX.slice(-4) === 'ALPH' && symbolY.slice(-4) === 'ALPH') {
        bestTiers.push({
          tokenX,
          tokenY,
          bestTierIndex: 0
        })
      } else {
        bestTiers.push({
          tokenX,
          tokenY,
          bestTierIndex: 2
        })
      }
    }
  }

  const unstableTokensValues = Object.values(unstableTokens)
  for (let i = 0; i < stableTokensValues.length; i++) {
    const tokenX = stableTokensValues[i]
    for (let j = 0; j < unstableTokensValues.length; j++) {
      const tokenY = unstableTokensValues[j]

      bestTiers.push({
        tokenX,
        tokenY,
        bestTierIndex: 2
      })
    }
  }

  return bestTiers
}
