import { all, spawn } from "@redux-saga/core/effects";
import { walletSaga } from "./wallet";
import { poolsSaga } from "./pools";
import { positionsSaga } from "./positions";
import { swapSaga } from "./swap";

function* rootSaga(): Generator {
  yield all([walletSaga, poolsSaga, positionsSaga, swapSaga].map(spawn));
}
export default rootSaga;
