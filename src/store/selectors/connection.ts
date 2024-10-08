import { IAlephiumConnectionStore, connectionSliceName } from '@store/reducers/connection'
import { AnyProps, keySelectors } from './helpers'

const store = (s: AnyProps) => s[connectionSliceName] as IAlephiumConnectionStore

export const { networkType, status, blockNumber, rpcAddress, invariantAddress, rpcStatus } =
  keySelectors(store, [
    'networkType',
    'status',
    'blockNumber',
    'rpcAddress',
    'invariantAddress',
    'rpcStatus'
  ])

export const alephiumConnectionSelectors = {
  networkType,
  status,
  blockNumber,
  rpcAddress,
  invariantAddress,
  rpcStatus
}

export default alephiumConnectionSelectors
