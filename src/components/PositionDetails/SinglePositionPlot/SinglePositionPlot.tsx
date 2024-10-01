import LiquidationRangeInfo from "@components/PositionDetails/LiquidationRangeInfo/LiquidationRangeInfo";
import PriceRangePlot from "@components/PriceRangePlot/PriceRangePlot";
import { getMinTick } from "@invariant-labs/alph-sdk";
import { Card, Grid, Tooltip, Typography } from "@mui/material";
import activeLiquidity from "@static/svg/activeLiquidity.svg";
import {
  calcPriceByTickIndex,
  calcTicksAmountInRange,
  numberToString,
  spacingMultiplicityGte,
} from "@utils/utils";
import { PlotTickData, TickPlotPositionData } from "@store/reducers/positions";
import React, { useEffect, useState } from "react";
import { ILiquidityToken } from "../SinglePositionInfo/consts";
import useStyles from "./style";

export interface ISinglePositionPlot {
  data: PlotTickData[];
  leftRange: TickPlotPositionData;
  rightRange: TickPlotPositionData;
  midPrice: TickPlotPositionData;
  currentPrice: number;
  tokenY: Pick<ILiquidityToken, "name" | "decimal">;
  tokenX: Pick<ILiquidityToken, "name" | "decimal">;
  ticksLoading: boolean;
  tickSpacing: bigint;
  min: number;
  max: number;
  xToY: boolean;
  hasTicksError?: boolean;
  reloadHandler: () => void;
}

const SinglePositionPlot: React.FC<ISinglePositionPlot> = ({
  data,
  leftRange,
  rightRange,
  midPrice,
  currentPrice,
  tokenY,
  tokenX,
  ticksLoading,
  tickSpacing,
  min,
  max,
  xToY,
  hasTicksError,
  reloadHandler,
}) => {
  const { classes } = useStyles();

  const [plotMin, setPlotMin] = useState(0);
  const [plotMax, setPlotMax] = useState(1);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentXtoY, setCurrentXtoY] = useState(xToY);

  const middle = (Math.abs(leftRange.x) + Math.abs(rightRange.x)) / 2;

  const calcZoomScale = (newMaxPlot: number) => {
    const proportionLength = newMaxPlot - middle;
    const scaleMultiplier = ((rightRange.x - middle) * 100) / proportionLength;

    return scaleMultiplier;
  };

  //Proportion between middle of price range and right range in ratio to middle of price range and plotMax
  const [zoomScale, setZoomScale] = useState(0.7);

  useEffect(() => {
    const initSideDist = Math.abs(
      leftRange.x -
        calcPriceByTickIndex(
          BigInt(
            Math.max(
              spacingMultiplicityGte(
                Number(getMinTick(tickSpacing)),
                Number(tickSpacing)
              ),
              Number(leftRange.index) - Number(tickSpacing) * 15
            )
          ),
          xToY,
          tokenX.decimal,
          tokenY.decimal
        )
    );

    if (currentXtoY !== xToY) {
      const plotMax = ((rightRange.x - middle) * 100) / zoomScale + middle;
      const plotMin = -(((middle - leftRange.x) * 100) / zoomScale - middle);

      setPlotMax(plotMax);
      setPlotMin(plotMin);
      setCurrentXtoY(xToY);
    }

    if (isInitialLoad) {
      setIsInitialLoad(false);
      setPlotMin(leftRange.x - initSideDist);
      setPlotMax(rightRange.x + initSideDist);

      setZoomScale(calcZoomScale(rightRange.x + initSideDist));
    }
  }, [ticksLoading, leftRange, rightRange, isInitialLoad]);

  const zoomMinus = () => {
    const diff = plotMax - plotMin;
    const newMin = plotMin - diff / 4;
    const newMax = plotMax + diff / 4;

    const zoomMultiplier = calcZoomScale(newMax);
    setZoomScale(zoomMultiplier);

    setPlotMin(newMin);
    setPlotMax(newMax);
  };

  const zoomPlus = () => {
    const diff = plotMax - plotMin;
    const newMin = plotMin + diff / 6;
    const newMax = plotMax - diff / 6;

    const zoomMultiplier = calcZoomScale(newMax);
    setZoomScale(zoomMultiplier);

    if (
      calcTicksAmountInRange(
        Math.max(newMin, 0),
        newMax,
        Number(tickSpacing),
        xToY,
        Number(tokenX.decimal),
        Number(tokenY.decimal)
      ) >= 4
    ) {
      setPlotMin(newMin);
      setPlotMax(newMax);
    }
  };

  return (
    <Grid item className={classes.root}>
      <Grid
        className={classes.headerContainer}
        container
        justifyContent="space-between"
      >
        <Typography className={classes.header}>Price range</Typography>
        <Grid>
          <Tooltip
            enterTouchDelay={0}
            leaveTouchDelay={Number.MAX_SAFE_INTEGER}
            title={
              <>
                <Typography className={classes.liquidityTitle}>
                  Active liquidity
                </Typography>
                <Typography
                  className={classes.liquidityDesc}
                  style={{ marginBottom: 12 }}
                >
                  While selecting the price range, note where active liquidity
                  is located. Your liquidity can be inactive and, as a
                  consequence, not generate profits.
                </Typography>
                <Grid
                  container
                  direction="row"
                  wrap="nowrap"
                  alignItems="center"
                  style={{ marginBottom: 12 }}
                >
                  <Typography className={classes.liquidityDesc}>
                    The active liquidity range is represented by white, dashed
                    lines in the liquidity chart. Active liquidity is determined
                    by the maximum price range resulting from the statistical
                    volume of exchanges for the last 7 days.
                  </Typography>
                  <img
                    className={classes.liquidityImg}
                    src={activeLiquidity}
                    alt="Liquidity"
                  />
                </Grid>
                <Typography className={classes.liquidityNote}>
                  Note: active liquidity borders are always aligned to the
                  nearest initialized ticks.
                </Typography>
              </>
            }
            placement="bottom"
            classes={{
              tooltip: classes.liquidityTooltip,
            }}
          >
            <Typography className={classes.activeLiquidity}>
              Active liquidity{" "}
              <span className={classes.activeLiquidityIcon}>i</span>
            </Typography>
          </Tooltip>
          <Typography className={classes.currentPrice}>
            Current price ━━━
          </Typography>
        </Grid>
      </Grid>
      <Grid className={classes.plotWrapper}>
        <PriceRangePlot
          data={data}
          plotMin={plotMin}
          plotMax={plotMax}
          zoomMinus={zoomMinus}
          zoomPlus={zoomPlus}
          disabled
          leftRange={leftRange}
          rightRange={rightRange}
          midPrice={midPrice}
          className={classes.plot}
          loading={ticksLoading}
          isXtoY={xToY}
          tickSpacing={tickSpacing}
          xDecimal={tokenX.decimal}
          yDecimal={tokenY.decimal}
          coverOnLoading
          hasError={hasTicksError}
          reloadHandler={reloadHandler}
        />
      </Grid>
      <Grid className={classes.minMaxInfo}>
        <LiquidationRangeInfo
          label="min"
          amount={min}
          tokenX={xToY ? tokenX.name : tokenY.name}
          tokenY={xToY ? tokenY.name : tokenX.name}
        />
        <LiquidationRangeInfo
          label="max"
          amount={max}
          tokenX={xToY ? tokenX.name : tokenY.name}
          tokenY={xToY ? tokenY.name : tokenX.name}
        />
      </Grid>
      <Grid className={classes.currentPriceContainer}>
        <Card className={classes.currentPriceLabel}>
          <Typography component="p">current price</Typography>
        </Card>
        <Card className={classes.currentPriceAmonut}>
          <Typography component="p">
            <Typography component="span">
              {numberToString(currentPrice)}
            </Typography>
            {xToY ? tokenY.name : tokenX.name} per{" "}
            {xToY ? tokenX.name : tokenY.name}
          </Typography>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SinglePositionPlot;