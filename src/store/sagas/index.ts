import { all, spawn } from "@redux-saga/core/effects";
import { walletSaga } from "./wallet";

function* rootSaga(): Generator {
  yield all([walletSaga].map(spawn));
}
export default rootSaga;
