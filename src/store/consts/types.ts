import { Network } from "@invariant-labs/alph-sdk";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";

interface ActionsBasicType {
  [k: string]: ActionCreatorWithPayload<any>;
}

export type PayloadType<actions extends ActionsBasicType> = {
  [k in keyof actions]: Parameters<actions[k]>[0];
};

export interface ISelectNetwork {
  networkType: Network;
  rpc: string;
  rpcName?: string;
}

export interface ISelectChain {
  name: Chain;
  address: string;
}

export enum Chain {
  Solana = "Solana",
  AlephZero = "Aleph Zero",
  Eclipse = "Eclipse",
  Vara = "Vara",
  Alephium = "Alephium",
}
