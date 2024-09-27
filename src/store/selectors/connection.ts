import {
  IAlephiumConnectionStore,
  connectionSliceName,
} from "@store/reducers/connection";
import { AnyProps, keySelectors } from "./helpers";

const store = (s: AnyProps) =>
  s[connectionSliceName] as IAlephiumConnectionStore;

export const {
  networkType,
  status,
  blockNumber,
  rpcAddress,
  invariantAddress,
} = keySelectors(store, [
  "networkType",
  "status",
  "blockNumber",
  "rpcAddress",
  "invariantAddress",
]);

export const alephiumConnectionSelectors = {
  networkType,
  status,
  blockNumber,
  rpcAddress,
  invariantAddress,
};

export default alephiumConnectionSelectors;
