import { all, put, select, takeLeading, spawn, call } from 'typed-redux-saga'
import { actions, RpcStatus, Status } from '@store/reducers/connection'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { networkType, rpcAddress, rpcStatus } from '@store/selectors/connection'
import { PayloadAction } from '@reduxjs/toolkit'
import { Network } from '@invariant-labs/alph-sdk'
import { web3 } from '@alephium/web3'
import { sleep } from './wallet'
import { RECOMMENDED_RPC_ADDRESS } from '@store/consts/static'

export function* handleRpcError(error: string): Generator {
  const currentRpc = yield* select(rpcAddress)
  const currentRpcStatus = yield* select(rpcStatus)
  const currentNetwork = yield* select(networkType)

  if (
    currentRpc !== RECOMMENDED_RPC_ADDRESS[currentNetwork] &&
    (error.includes('Failed to fetch') || error.includes('400') || error.includes('403'))
  ) {
    if (currentRpcStatus === RpcStatus.Uninitialized) {
      yield* put(actions.setRpcStatus(RpcStatus.Error))
    } else if (currentRpcStatus === RpcStatus.Ignored) {
      yield* put(actions.setRpcStatus(RpcStatus.IgnoredWithError))
    }
  }
}

export function* handleRpcErrorHandler(action: PayloadAction<PromiseRejectionEvent>): Generator {
  yield* call(handleRpcError, action.payload.reason.message)
}

export function* initConnection(): Generator {
  try {
    const rpc = yield* select(rpcAddress)
    web3.setCurrentNodeProvider(rpc)

    yield* put(
      snackbarsActions.add({
        message: 'Alephium network connected.',
        variant: 'success',
        persist: false
      })
    )

    yield* put(actions.setStatus(Status.Initialized))
  } catch (error) {
    console.log(error)
    yield* put(actions.setStatus(Status.Error))
    yield put(
      snackbarsActions.add({
        message: 'Failed to connect to Alephium network.',
        variant: 'error',
        persist: false
      })
    )

    yield* call(handleRpcError, (error as Error).message)
  }

  yield* call(sleep, 500)
}

export function* handleNetworkChange(action: PayloadAction<Network>): Generator {
  yield* put(
    snackbarsActions.add({
      message: `You are on network ${action.payload}`,
      variant: 'info',
      persist: false
    })
  )

  localStorage.setItem('INVARIANT_NETWORK_Alephium', action.payload)
  window.location.reload()
}

export function* networkChangeSaga(): Generator {
  yield takeLeading(actions.setNetwork, handleNetworkChange)
}
export function* initConnectionSaga(): Generator {
  yield takeLeading(actions.initAlephiumConnection, initConnection)
}

export function* handleRpcErrorSaga(): Generator {
  yield takeLeading(actions.handleRpcError, handleRpcErrorHandler)
}

export function* connectionSaga(): Generator {
  yield* all([networkChangeSaga, initConnectionSaga, handleRpcErrorSaga].map(spawn))
}
