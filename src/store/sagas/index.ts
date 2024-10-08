import { all, spawn } from '@redux-saga/core/effects'
import { walletSaga } from './wallet'
import { poolsSaga } from './pools'
import { positionsSaga } from './positions'
import { swapSaga } from './swap'
import { statsHandler } from './stats'
import { connectionSaga } from './connection'

function* rootSaga(): Generator {
  yield all(
    [connectionSaga, walletSaga, poolsSaga, positionsSaga, swapSaga, statsHandler].map(spawn)
  )
}
export default rootSaga
