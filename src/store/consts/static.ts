import {
  ALPH_TOKEN_ID,
  BTC_ID as BTC_ID_SDK,
  ETH_ID as ETH_ID_SDK,
  Network,
  USDC_ID as USDC_ID_SDK,
  Position,
  Percentage,
  Liquidity,
  FeeGrowth,
  TokenAmount,
  FEE_TIERS,
  MAX_POSITIONS_QUERIED,
  ONE_ALPH
} from '@invariant-labs/alph-sdk'
import {
  BestTier,
  Chain,
  FormatNumberThreshold,
  PrefixConfig,
  Token,
  TokenPriceData
} from './types'
import { bestTiersCreator } from '@utils/uiUtils'
import mainnetListJson from '@store/consts/tokenLists/mainnet.json'

export const BTC_ID = {
  ...BTC_ID_SDK,
  [Network.Mainnet]: 'xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR'
}
export const ETH_ID = {
  ...ETH_ID_SDK,
  [Network.Mainnet]: 'vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb'
}
export const USDC_ID = {
  ...USDC_ID_SDK,
  [Network.Mainnet]: '22Nb9JajRpAh9A2fWNgoKt867PA6zNyi541rtoraDfKXV'
}

export enum RPC {
  TEST = 'https://node.testnet.alephium.org',
  MAIN = 'https://node.mainnet.alephium.org'
}

export const POSITIONS_PER_PAGE = 5

export const STABLECOIN_ADDRESSES: string[] = []

export const tokensPrices: Record<Network, Record<string, TokenPriceData>> = {
  [Network.Testnet]: { USDC_TEST: { price: 1 }, BTC_TEST: { price: 64572.0 } },
  [Network.Mainnet]: {},
  [Network.Devnet]: {}
}

export const TokenAirdropAmount = {
  BTC: 100000n,
  ETH: 20000000000000000n,
  USDC: 50000000n
}

export const getFaucetTokenList = (network: Network) => {
  return {
    BTC: BTC_ID[network],
    ETH: ETH_ID[network],
    USDC: USDC_ID[network]
  }
}

export const TESTNET_BTC: Token = {
  symbol: 'BTC',
  address: BTC_ID[Network.Testnet],
  decimals: 8n,
  name: 'Bitcoin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
  coingeckoId: 'bitcoin'
}

export const TESTNET_ETH: Token = {
  symbol: 'ETH',
  address: ETH_ID[Network.Testnet],
  decimals: 18n,
  name: 'Ether',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png',
  coingeckoId: 'ethereum'
}

export const TESTNET_USDC: Token = {
  symbol: 'USDC',
  address: USDC_ID[Network.Testnet],
  decimals: 6n,
  name: 'USDC',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  coingeckoId: 'usd-coin'
}

export const TESTNET_ALPH: Token = {
  symbol: 'ALPH',
  address: ALPH_TOKEN_ID,
  decimals: 18n,
  name: 'Alephium',
  logoURI:
    'https://assets.coingecko.com/coins/images/21598/standard/Alephium-Logo_200x200_listing.png',
  coingeckoId: 'alephium'
}

export const DEFAULT_TOKENS = ['bitcoin', 'ethereum', 'usd-coin', 'alephium']

export const bestTiers: Record<Network, BestTier[]> = {
  [Network.Testnet]: bestTiersCreator(Network.Testnet),
  [Network.Mainnet]: [],
  [Network.Devnet]: bestTiersCreator(Network.Devnet)
}

export const commonTokensForNetworks: Record<Network, string[]> = {
  [Network.Testnet]: [
    TESTNET_BTC.address,
    TESTNET_ETH.address,
    TESTNET_USDC.address,
    TESTNET_ALPH.address
  ],
  [Network.Mainnet]: [
    BTC_ID[Network.Mainnet],
    ETH_ID[Network.Mainnet],
    USDC_ID[Network.Mainnet],
    ALPH_TOKEN_ID
  ],
  [Network.Devnet]: []
}

const commonTokensLogos = {
  [BTC_ID[Network.Mainnet]]:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
  [ETH_ID[Network.Mainnet]]:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png',
  [USDC_ID[Network.Mainnet]]:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  [ALPH_TOKEN_ID]:
    'https://assets.coingecko.com/coins/images/21598/standard/Alephium-Logo_200x200_listing.png'
}

export const mainnetList = (() => {
  const parsedMainnetList: Record<string, Token> = {}

  const mainnetList = mainnetListJson as unknown as Record<string, Token>

  Object.keys(mainnetList).forEach(token => {
    if (commonTokensLogos[token]) {
      parsedMainnetList[token] = {
        ...mainnetList[token],
        logoURI: commonTokensLogos[token]
      }
    } else {
      parsedMainnetList[token] = mainnetList[token]
    }
  })

  return parsedMainnetList
})()

export const ALL_FEE_TIERS_DATA = FEE_TIERS.map((tier, index) => ({
  tier,
  primaryIndex: index
}))

export const U256MAX = 2n ** 256n - 1n

export const SWAP_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.1 * Number(ONE_ALPH)))
export const POOL_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.55 * Number(ONE_ALPH)))
export const POSITION_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.7 * Number(ONE_ALPH)))
export const FAUCET_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.02 * Number(ONE_ALPH)))

export enum ErrorMessage {
  TRANSACTION_SIGNING_ERROR = 'Error while signing transaction.'
}

export const REFRESHER_INTERVAL = 20

export const defaultThresholds: FormatNumberThreshold[] = [
  {
    value: 10,
    decimals: 4
  },
  {
    value: 1000,
    decimals: 2
  },
  {
    value: 10000,
    decimals: 1
  },
  {
    value: 1000000,
    decimals: 2,
    divider: 1000
  },
  {
    value: 1000000000,
    decimals: 2,
    divider: 1000000
  },
  {
    value: Infinity,
    decimals: 2,
    divider: 1000000000
  }
]

export const COINGECKO_QUERY_COOLDOWN = 20 * 60 * 1000

export const FormatConfig = {
  B: 1000000000,
  M: 1000000,
  K: 1000,
  BDecimals: 9,
  MDecimals: 6,
  KDecimals: 3,
  DecimalsAfterDot: 2
}

export enum PositionTokenBlock {
  None,
  A,
  B
}

export const subNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

export const defaultPrefixConfig: PrefixConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000
}

export const getAddressTickerMap = (network: Network): { [k: string]: string } => {
  if (network !== Network.Mainnet) {
    return {
      BTC: BTC_ID[network],
      ETH: ETH_ID[network],
      USDC: USDC_ID[network],
      ALPH: ALPH_TOKEN_ID
    }
  } else {
    const parsedMainnetList = mainnetList as unknown as Record<string, Token>
    const result: { [k: string]: string } = {}

    Object.keys(parsedMainnetList).forEach((key: string) => {
      const token = parsedMainnetList[key]
      result[token.symbol] = token.address
    })

    return result
  }
}

export const getReversedAddressTickerMap = (network: Network) => {
  return Object.fromEntries(
    Object.entries(getAddressTickerMap(network)).map(([key, value]) => [value, key])
  )
}

export const LIQUIDITY_PLOT_DECIMAL = 12n

export const DEFAULT_TOKEN_DECIMAL = 12n

export const EMPTY_POSITION: Position = {
  owner: '',
  poolKey: {
    tokenX: TESTNET_BTC.address,
    tokenY: TESTNET_ETH.address,
    feeTier: { fee: 0n as Percentage, tickSpacing: 1n }
  },
  liquidity: 0n as Liquidity,
  lowerTickIndex: 0n,
  upperTickIndex: 0n,
  feeGrowthInsideX: 0n as FeeGrowth,
  feeGrowthInsideY: 0n as FeeGrowth,
  lastBlockNumber: 0n,
  tokensOwedX: 0n as TokenAmount,
  tokensOwedY: 0n as TokenAmount
}

export const POSITIONS_PER_QUERY =
  Number(MAX_POSITIONS_QUERIED) - (Number(MAX_POSITIONS_QUERIED) % POSITIONS_PER_PAGE)

export const MINIMAL_POOL_INIT_PRICE = 0.00000001

export const DEFAULT_SWAP_SLIPPAGE = '0.50'
export const DEFAULT_NEW_POSITION_SLIPPAGE = '0.50'

export const CHAINS = [
  { name: Chain.Solana, address: 'https://invariant.app/swap' },
  { name: Chain.AlephZero, address: 'https://azero.invariant.app/exchange' },
  { name: Chain.Eclipse, address: 'https://eclipse.invariant.app/swap' },
  { name: Chain.Vara, address: 'https://vara.invariant.app/exchange' },
  { name: Chain.Alephium, address: 'https://alph.invariant.app/exchange' }
]

export const enum SortTypePoolList {
  NAME_ASC,
  NAME_DESC,
  FEE_ASC,
  FEE_DESC,
  VOLUME_ASC,
  VOLUME_DESC,
  TVL_ASC,
  TVL_DESC
  // APY_ASC,
  // APY_DESC
}

export const enum SortTypeTokenList {
  NAME_ASC,
  NAME_DESC,
  PRICE_ASC,
  PRICE_DESC,
  // CHANGE_ASC,
  // CHANGE_DESC,
  VOLUME_ASC,
  VOLUME_DESC,
  TVL_ASC,
  TVL_DESC
}

export const RECOMMENDED_RPC_ADDRESS = {
  [Network.Testnet]: RPC.TEST,
  [Network.Mainnet]: RPC.MAIN,
  [Network.Devnet]: ''
}
