import {
  PoolKey,
  MAX_POOL_KEYS_RETURNED,
  Invariant,
  FungibleToken,
} from "@invariant-labs/alph-sdk";
import { PayloadAction } from "@reduxjs/toolkit";
import {
  findPairs,
  getTokenBalances,
  getTokenDataByAddresses,
  poolKeyToString,
} from "@utils/utils";
import {
  FetchTicksAndTickMaps,
  PairTokens,
  PoolWithPoolKey,
  actions,
} from "@store/reducers/pools";
import { actions as walletActions } from "@store/reducers/wallet";
import { poolsArraySortedByFees, tokens } from "@store/selectors/pools";
import { address } from "@store/selectors/wallet";
import {
  all,
  call,
  put,
  select,
  spawn,
  take,
  takeEvery,
  takeLatest,
} from "typed-redux-saga";
import { invariantAddress } from "@store/selectors/connection";

export function* fetchPoolData(action: PayloadAction<PoolKey>): Generator {
  try {
    const address = yield* select(invariantAddress);
    const invariant = yield* call(Invariant.load, address);

    const pool = yield* call([invariant, invariant.getPool], action.payload);

    if (pool) {
      yield* put(
        actions.addPool({
          ...pool,
          poolKey: action.payload,
        })
      );
    } else {
      yield* put(actions.addPool());
    }
  } catch (error) {
    console.log(error);
    yield* put(actions.addPool());
  }
}

export function* fetchAllPoolKeys(): Generator {
  try {
    const address = yield* select(invariantAddress);
    const invariant = yield* call(Invariant.load, address);

    const [poolKeys, poolKeysCount] = yield* call(
      [invariant, invariant.getPoolKeys],
      MAX_POOL_KEYS_RETURNED,
      0n
    );

    const promises: Promise<[PoolKey[], bigint]>[] = [];
    for (let i = 1; i < Math.ceil(Number(poolKeysCount) / 220); i++) {
      promises.push(
        invariant.getPoolKeys(MAX_POOL_KEYS_RETURNED, BigInt(i) * 220n)
      );
    }

    const poolKeysEntries = yield* call(
      (promises) => Promise.all(promises),
      promises
    );

    yield* put(
      actions.setPoolKeys([
        ...poolKeys,
        ...poolKeysEntries.map(([poolKeys]) => poolKeys).flat(1),
      ])
    );
  } catch (error) {
    yield* put(actions.setPoolKeys([]));
    console.log(error);
  }
}

export function* fetchAllPoolsForPairData(action: PayloadAction<PairTokens>) {
  try {
    const address = yield* select(invariantAddress);
    const invariant = yield* call(Invariant.load, address);

    const token0 = action.payload.first.toString();
    const token1 = action.payload.second.toString();
    const poolPairs = yield* call(
      [invariant, invariant.getAllPoolsForPair],
      token0,
      token1
    );

    yield* put(actions.addPools(poolPairs));
  } catch (error) {
    console.log(error);
  }
}

export function* fetchTicksAndTickMaps(
  action: PayloadAction<FetchTicksAndTickMaps>
) {
  const { tokenFrom, tokenTo, poolKey } = action.payload;
  let poolsData = yield* select(poolsArraySortedByFees);

  if (poolKey) {
    const pools = poolsData.filter(
      (pool) => poolKeyToString(pool.poolKey) === poolKeyToString(poolKey)
    );

    if (pools.length === 0) {
      yield* take(actions.addPool);

      poolsData = yield* select(poolsArraySortedByFees);
    }
  }

  try {
    const address = yield* select(invariantAddress);
    const invariant = yield* call(Invariant.load, address);
    const pools = findPairs(
      tokenFrom.toString(),
      tokenTo.toString(),
      poolsData
    );

    const tickmapCalls = pools.map((pool) =>
      call([invariant, invariant.getFullTickmap], pool.poolKey)
    );
    const allTickMaps = yield* all(tickmapCalls);

    for (const [index, pool] of pools.entries()) {
      yield* put(
        actions.setTickMaps({
          poolKey: pool.poolKey,
          tickMapStructure: allTickMaps[index],
        })
      );
    }

    const allTicksCalls = pools.map((pool, index) =>
      call(
        [invariant, invariant.getAllLiquidityTicks],
        pool.poolKey,
        allTickMaps[index]
      )
    );
    const allTicks = yield* all(allTicksCalls);

    for (const [index, pool] of pools.entries()) {
      yield* put(
        actions.setTicks({
          poolKey: pool.poolKey,
          tickStructure: allTicks[index],
        })
      );
    }

    yield* put(actions.stopIsLoadingTicksAndTickMaps());
  } catch (error) {
    console.log(error);
  }
}

export function* fetchTokens(poolsWithPoolKeys: PoolWithPoolKey[]) {
  const walletAddress = yield* select(address);
  const allTokens = yield* select(tokens);
  const fungibleToken = FungibleToken.load();

  const unknownTokens = new Set(
    poolsWithPoolKeys.flatMap(({ poolKey: { tokenX, tokenY } }) =>
      [tokenX, tokenY].filter((token) => !allTokens[token])
    )
  );
  const knownTokens = new Set(
    poolsWithPoolKeys.flatMap(({ poolKey: { tokenX, tokenY } }) =>
      [tokenX, tokenY].filter((token) => allTokens[token])
    )
  );

  const { unknownTokensData, knownTokenBalances } = yield* all({
    unknownTokensData: call(
      getTokenDataByAddresses,
      [...unknownTokens],
      fungibleToken,
      walletAddress
    ),
    knownTokenBalances: call(
      getTokenBalances,
      [...knownTokens],
      fungibleToken,
      walletAddress
    ),
  });

  yield* put(actions.addTokens(unknownTokensData));
  yield* put(
    walletActions.addTokenBalances(
      Object.entries(unknownTokensData).map(([address, token]) => ({
        address,
        balance: token.balance ?? 0n,
      }))
    )
  );
  yield* put(actions.updateTokenBalances(knownTokenBalances));
}

export function* handleGetTokens(action: PayloadAction<string[]>) {
  const tokens = action.payload;

  const walletAddress = yield* select(address);
  const fungibleToken = FungibleToken.load();

  try {
    const tokensData = yield* call(
      getTokenDataByAddresses,
      tokens,
      fungibleToken,
      walletAddress
    );

    yield* put(actions.addTokens(tokensData));
  } catch (e) {
    yield* put(actions.setTokensError(true));
  }
}

export function* getPoolDataHandler(): Generator {
  yield* takeLatest(actions.getPoolData, fetchPoolData);
}

export function* getPoolKeysHandler(): Generator {
  yield* takeLatest(actions.getPoolKeys, fetchAllPoolKeys);
}

export function* getAllPoolsForPairDataHandler(): Generator {
  yield* takeLatest(actions.getAllPoolsForPairData, fetchAllPoolsForPairData);
}

export function* getTicksAndTickMapsHandler(): Generator {
  yield* takeEvery(actions.getTicksAndTickMaps, fetchTicksAndTickMaps);
}

export function* getTokensHandler(): Generator {
  yield* takeLatest(actions.getTokens, handleGetTokens);
}

export function* poolsSaga(): Generator {
  yield all(
    [
      getPoolDataHandler,
      getPoolKeysHandler,
      getAllPoolsForPairDataHandler,
      getTicksAndTickMapsHandler,
      getTokensHandler,
    ].map(spawn)
  );
}
