import { ActionCreatorWithPayload } from "@reduxjs/toolkit";

interface ActionsBasicType {
  [k: string]: ActionCreatorWithPayload<any>;
}

export type PayloadType<actions extends ActionsBasicType> = {
  [k in keyof actions]: Parameters<actions[k]>[0];
};
