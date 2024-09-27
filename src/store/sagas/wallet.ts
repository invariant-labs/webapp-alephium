import { ALPH_TOKEN_ID, SignerProvider } from "@alephium/web3";
import { FungibleToken, TokenAmount } from "@invariant-labs/alph-sdk";
import { balanceOf } from "@invariant-labs/alph-sdk/dist/src/utils";
import { PayloadAction } from "@reduxjs/toolkit";
import {
  FAUCET_SAFE_TRANSACTION_FEE,
  getFaucetTokenList,
  TokenAirdropAmount,
} from "@store/consts/static";
import { actions as snackbarsActions } from "@store/reducers/snackbars";
import { Status, actions } from "@store/reducers/wallet";
import { networkType } from "@store/selectors/connection";
import { balance, signer, status } from "@store/selectors/wallet";
import { createLoaderKey } from "@utils/utils";
import { closeSnackbar } from "notistack";
import {
  all,
  call,
  put,
  select,
  spawn,
  takeLatest,
  takeLeading,
} from "typed-redux-saga";

export function* handleAirdrop(): Generator {
  const walletSigner = yield* select(signer);
  const walletBalance = yield* select(balance);

  if (!walletSigner) {
    return yield* put(
      snackbarsActions.add({
        message: "Connect wallet to claim the faucet.",
        variant: "error",
        persist: false,
      })
    );
  }

  if (FAUCET_SAFE_TRANSACTION_FEE > walletBalance) {
    return yield* put(
      snackbarsActions.add({
        message: "Insufficient ALPH balance.",
        variant: "error",
        persist: false,
      })
    );
  }

  const loaderAirdrop = createLoaderKey();
  let loaderSigningTx = createLoaderKey();

  try {
    yield put(
      snackbarsActions.add({
        message: "Airdrop in progress...",
        variant: "pending",
        persist: true,
        key: loaderAirdrop,
      })
    );

    const network = yield* select(networkType);

    const fungibleToken = FungibleToken.load();

    const faucetTokenList = getFaucetTokenList(network);

    for (const ticker in faucetTokenList) {
      const address = faucetTokenList[ticker as keyof typeof faucetTokenList];
      const airdropAmount =
        TokenAirdropAmount[ticker as keyof typeof faucetTokenList];

      loaderSigningTx = createLoaderKey();
      yield put(
        snackbarsActions.add({
          message: "Signing transaction...",
          variant: "pending",
          persist: true,
          key: loaderSigningTx,
        })
      );

      const txId = yield* call(
        [fungibleToken, fungibleToken.mint],
        walletSigner,
        airdropAmount as TokenAmount,
        address
      );

      closeSnackbar(loaderSigningTx);
      yield put(snackbarsActions.remove(loaderSigningTx));

      yield* put(
        snackbarsActions.add({
          message: `Airdropped ${ticker} token`,
          variant: "success",
          persist: false,
          txid: txId,
        })
      );
    }

    closeSnackbar(loaderAirdrop);
    yield put(snackbarsActions.remove(loaderAirdrop));

    // yield* call(fetchBalances, [...Object.values(faucetTokenList)]);
  } catch (error) {
    console.log(error);

    closeSnackbar(loaderSigningTx);
    yield put(snackbarsActions.remove(loaderSigningTx));
    closeSnackbar(loaderAirdrop);
    yield put(snackbarsActions.remove(loaderAirdrop));
  }
}

export function* init(
  isEagerConnect: boolean,
  signer: SignerProvider
): Generator {
  try {
    yield* put(actions.setStatus(Status.Init));

    if (isEagerConnect) {
      yield* put(
        snackbarsActions.add({
          message: "Wallet reconnected.",
          variant: "success",
          persist: false,
        })
      );
    } else {
      yield* put(
        snackbarsActions.add({
          message: "Wallet connected.",
          variant: "success",
          persist: false,
        })
      );
    }

    yield* put(actions.setSigner(signer));
    const account = yield* call([signer, signer.getSelectedAccount]);
    yield* put(actions.setAddress(account.address));

    // const allTokens = yield* select(tokens);
    // yield* call(fetchBalances, Object.keys(allTokens));

    const balance = yield* call(balanceOf, ALPH_TOKEN_ID, account.address);
    yield* put(actions.setBalance(balance));

    yield* put(actions.setStatus(Status.Initialized));
  } catch (error) {
    console.log(error);
  }
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function* handleConnect(
  action: PayloadAction<{
    isEagerConnect: boolean;
    signer: SignerProvider;
  }>
): Generator {
  const walletStatus = yield* select(status);
  if (walletStatus === Status.Initialized) {
    yield* put(
      snackbarsActions.add({
        message: "Wallet already connected.",
        variant: "info",
        persist: false,
      })
    );
    return;
  }
  const { isEagerConnect, signer } = action.payload;
  yield* call(init, isEagerConnect, signer);
}

export function* handleDisconnect(): Generator {
  try {
    // const { loadedPages } = yield* select(positionsList);

    yield* put(actions.resetState());

    yield* put(
      snackbarsActions.add({
        message: "Wallet disconnected.",
        variant: "success",
        persist: false,
      })
    );

    // yield* put(positionsActions.setPositionsList([]));
    // yield* put(positionsActions.setPositionsListLength(0n));
    // yield* put(
    //   positionsActions.setPositionsListLoadedStatus({
    //     indexes: Object.keys(loadedPages).map((key) => Number(key)),
    //     isLoaded: false,
    //   })
    // );

    // yield* put(
    //   positionsActions.setCurrentPositionTicks({
    //     lowerTick: undefined,
    //     upperTick: undefined,
    //   })
    // );
  } catch (error) {
    console.log(error);
  }
}

export function* connectHandler(): Generator {
  yield takeLatest(actions.connect, handleConnect);
}

export function* disconnectHandler(): Generator {
  yield takeLatest(actions.disconnect, handleDisconnect);
}

export function* airdropSaga(): Generator {
  yield takeLeading(actions.airdrop, handleAirdrop);
}

export function* walletSaga(): Generator {
  yield all([airdropSaga, connectHandler, disconnectHandler].map(spawn));
}
