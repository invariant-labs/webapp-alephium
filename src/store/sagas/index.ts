import { all, spawn } from "@redux-saga/core/effects";
import { walletSaga } from "./wallet";
import { poolsSaga } from "./pools";
import { positionsSaga } from "./positions";

function* rootSaga(): Generator {
  yield all([walletSaga, poolsSaga, positionsSaga].map(spawn));
}
export default rootSaga;
