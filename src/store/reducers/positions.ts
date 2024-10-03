import { PoolKey, Position, Tick } from "@invariant-labs/alph-sdk";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { PayloadType } from "@store/consts/types";

export interface PositionsListStore {
  length: bigint;
  loadedPages: Record<number, boolean>;
  list: Position[];
  loading: boolean;
}
export interface PlotTickData {
  x: number;
  y: number;
  index: bigint;
}

export type TickPlotPositionData = Omit<PlotTickData, "y">;

export type InitMidPrice = TickPlotPositionData & { sqrtPrice: bigint };

export interface PlotTicks {
  allData: PlotTickData[];
  userData: PlotTickData[];
  loading: boolean;
  hasError?: boolean;
}

export interface InitPositionStore {
  inProgress: boolean;
  success: boolean;
}
export interface CurrentPositionTicksStore {
  lowerTick?: Tick;
  upperTick?: Tick;
  loading: boolean;
}

export interface IPositionsStore {
  lastPage: number;
  plotTicks: PlotTicks;
  positionsList: PositionsListStore;
  currentPositionTicks: CurrentPositionTicksStore;
  initPosition: InitPositionStore;
  shouldNotUpdateRange: boolean;
}
export interface InitPositionData {
  poolKeyData: PoolKey;
  lowerTick: bigint;
  upperTick: bigint;
  liquidityDelta: bigint;
  spotSqrtPrice: bigint;
  slippageTolerance: bigint;
  tokenXAmount: bigint;
  tokenYAmount: bigint;
  initPool?: boolean;
}
export interface GetCurrentTicksData {
  poolKey: PoolKey;
  isXtoY: boolean;
  fetchTicksAndTickmap?: boolean;
  disableLoading?: boolean;
  onlyUserPositionsEnabled?: boolean;
}

export interface ClosePositionData {
  positionIndex: bigint;
  claimFarmRewards?: boolean;
  onSuccess: () => void;
  addressTokenX: string;
  addressTokenY: string;
}

export interface SetPositionData {
  index: bigint;
  position: Position;
}

export interface GetPositionTicks {
  poolKey: PoolKey;
  lowerTickIndex: bigint;
  upperTickIndex: bigint;
}

export interface HandleClaimFee {
  index: bigint;
  addressTokenX: string;
  addressTokenY: string;
}

export const defaultState: IPositionsStore = {
  lastPage: 1,
  plotTicks: {
    allData: [],
    userData: [],
    loading: false,
  },
  positionsList: {
    length: 0n,
    loadedPages: {},
    list: [],
    loading: true,
  },
  currentPositionTicks: {
    lowerTick: undefined,
    upperTick: undefined,
    loading: false,
  },
  initPosition: {
    inProgress: false,
    success: false,
  },
  shouldNotUpdateRange: false,
};

export const positionsSliceName = "positions";
const positionsSlice = createSlice({
  name: "positions",
  initialState: defaultState,
  reducers: {
    setLastPage(state, action: PayloadAction<number>) {
      state.lastPage = action.payload;
      return state;
    },
    initPosition(state, _action: PayloadAction<InitPositionData>) {
      state.initPosition.inProgress = true;
      return state;
    },
    setInitPositionSuccess(state, action: PayloadAction<boolean>) {
      state.initPosition.inProgress = false;
      state.initPosition.success = action.payload;
      return state;
    },
    setPlotTicks(
      state,
      action: PayloadAction<{
        allPlotTicks: PlotTickData[];
        userPlotTicks: PlotTickData[];
      }>
    ) {
      state.plotTicks.allData = action.payload.allPlotTicks;
      state.plotTicks.userData = action.payload.userPlotTicks;
      state.plotTicks.loading = false;
      state.plotTicks.hasError = false;
      return state;
    },
    setErrorPlotTicks(state, action: PayloadAction<PlotTickData[]>) {
      state.plotTicks.allData = action.payload;
      state.plotTicks.userData = action.payload;
      state.plotTicks.loading = false;
      state.plotTicks.hasError = true;
      return state;
    },
    getCurrentPlotTicks(state, action: PayloadAction<GetCurrentTicksData>) {
      state.plotTicks.hasError = false;
      state.plotTicks.loading = !action.payload.disableLoading;
      return state;
    },
    setPositionsList(state, action: PayloadAction<Position[]>) {
      state.positionsList.list = action.payload;
      state.positionsList.loading = false;
      return state;
    },
    getPositionsListPage(
      state,
      _action: PayloadAction<{ index: number; refresh: boolean }>
    ) {
      state.positionsList.loading = true;
      return state;
    },
    getRemainingPositions(
      state,
      _action: PayloadAction<{ setLoaded: boolean }>
    ) {
      state.positionsList.loading = true;
      return state;
    },
    setPositionsListLength(state, action: PayloadAction<bigint>) {
      state.positionsList.length = action.payload;
      return state;
    },
    setPositionsListLoadedStatus(
      state,
      action: PayloadAction<{ indexes: number[]; isLoaded: boolean }>
    ) {
      const { indexes, isLoaded } = action.payload;

      for (const index of indexes) {
        state.positionsList.loadedPages[index] = isLoaded;
      }

      return state;
    },
    removePosition(state, action: PayloadAction<bigint>) {
      if (Number(action.payload) !== state.positionsList.list.length - 1) {
        state.positionsList.list[Number(action.payload)] =
          state.positionsList.list[state.positionsList.list.length - 1];
      }

      state.positionsList.list.pop();
      state.positionsList.length -= 1n;

      return state;
    },
    addPosition(state, action: PayloadAction<Position>) {
      state.positionsList.list.push(action.payload);
      state.positionsList.length += 1n;
      return state;
    },
    getSinglePosition(state, _action: PayloadAction<bigint>) {
      return state;
    },
    setSinglePosition(state, action: PayloadAction<SetPositionData>) {
      state.positionsList.list[Number(action.payload.index)] =
        action.payload.position;
      return state;
    },
    getCurrentPositionTicks(state, _action: PayloadAction<GetPositionTicks>) {
      state.currentPositionTicks.loading = true;
      return state;
    },
    setCurrentPositionTicks(
      state,
      action: PayloadAction<{ lowerTick?: Tick; upperTick?: Tick }>
    ) {
      state.currentPositionTicks = {
        ...action.payload,
        loading: false,
      };
      return state;
    },
    setCurrentPositionTickLoading(state, action: PayloadAction<boolean>) {
      state.currentPositionTicks.loading = action.payload;
      return state;
    },
    claimFee(state, _action: PayloadAction<HandleClaimFee>) {
      return state;
    },
    closePosition(state, _action: PayloadAction<ClosePositionData>) {
      return state;
    },
    resetState(state) {
      state = defaultState;
      return state;
    },
    setShouldNotUpdateRange(state, action: PayloadAction<boolean>) {
      state.shouldNotUpdateRange = action.payload;
      return state;
    },
  },
});

export const actions = positionsSlice.actions;
export const reducer = positionsSlice.reducer;
export type PayloadTypes = PayloadType<typeof actions>;
