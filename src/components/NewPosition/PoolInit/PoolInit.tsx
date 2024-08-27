import RangeInput from '@components/Inputs/RangeInput/RangeInput'
import SimpleInput from '@components/Inputs/SimpleInput/SimpleInput'
import { Button, Grid, Typography } from '@mui/material'
import {
  calcPriceByTickIndex,
  calculateConcentrationRange,
  calculateSqrtPriceFromBalance,
  formatNumber,
  nearestTickIndex,
  toMaxNumericPlaces,
  trimZeros,
  calculateTickFromBalance,
  validConcentrationMidPriceTick
} from '@utils/utils'
import React, { useEffect, useMemo, useState } from 'react'
import useStyles from './style'
import { calculateTick, calculateTickDelta, getMaxTick, getMinTick } from '@invariant-labs/a0-sdk'
import { PositionOpeningMethod } from '@store/consts/types'
import ConcentrationSlider from '../ConcentrationSlider/ConcentrationSlider'
import { MINIMAL_POOL_INIT_PRICE } from '@store/consts/static'
import AnimatedNumber from '@components/AnimatedNumber/AnimatedNumber'

export interface IPoolInit {
  tokenASymbol: string
  tokenBSymbol: string
  onChangeRange: (leftIndex: bigint, rightIndex: bigint) => void
  isXtoY: boolean
  xDecimal: bigint
  yDecimal: bigint
  tickSpacing: bigint
  midPriceIndex: bigint
  onChangeMidPrice: (tickIndex: bigint, sqrtPrice: bigint) => void
  currentPairReversed: boolean | null
  positionOpeningMethod?: PositionOpeningMethod
  setConcentrationIndex: (val: number) => void
  concentrationIndex: number
  concentrationArray: number[]
  minimumSliderIndex: number
}

export const PoolInit: React.FC<IPoolInit> = ({
  tokenASymbol,
  tokenBSymbol,
  onChangeRange,
  isXtoY,
  xDecimal,
  yDecimal,
  tickSpacing,
  midPriceIndex,
  onChangeMidPrice,
  currentPairReversed,
  positionOpeningMethod,
  setConcentrationIndex,
  concentrationIndex,
  concentrationArray,
  minimumSliderIndex
}) => {
  const minTick = getMinTick(tickSpacing)
  const maxTick = getMaxTick(tickSpacing)

  const { classes } = useStyles()

  const [leftRange, setLeftRange] = useState(tickSpacing * 10n * (isXtoY ? -1n : 1n))
  const [rightRange, setRightRange] = useState(tickSpacing * 10n * (isXtoY ? 1n : -1n))

  const [leftInput, setLeftInput] = useState(
    calcPriceByTickIndex(leftRange, isXtoY, xDecimal, yDecimal).toString()
  )
  const [rightInput, setRightInput] = useState(
    calcPriceByTickIndex(rightRange, isXtoY, xDecimal, yDecimal).toString()
  )

  const [leftInputRounded, setLeftInputRounded] = useState((+leftInput).toFixed(12))
  const [rightInputRounded, setRightInputRounded] = useState((+rightInput).toFixed(12))

  const [midPriceInput, setMidPriceInput] = useState(
    calcPriceByTickIndex(midPriceIndex, isXtoY, xDecimal, yDecimal).toFixed(8)
  )

  const validConcentrationMidPrice = (midPrice: string) => {
    const minTick = getMinTick(tickSpacing)
    const maxTick = getMaxTick(tickSpacing)

    const midPriceTick = BigInt(
      calculateTickFromBalance(+midPrice, tickSpacing, isXtoY, xDecimal, yDecimal)
    )

    const parsedTickSpacing = Number(tickSpacing)
    const tickDelta = BigInt(calculateTickDelta(parsedTickSpacing, 2, 2))

    const minTickLimit = minTick + (2n + tickDelta) * tickSpacing
    const maxTickLimit = maxTick - (2n + tickDelta) * tickSpacing

    const minPrice = calcPriceByTickIndex(minTickLimit, isXtoY, xDecimal, yDecimal)
    const maxPrice = calcPriceByTickIndex(maxTickLimit, isXtoY, xDecimal, yDecimal)

    if (isXtoY) {
      if (midPriceTick < minTickLimit) {
        return minPrice
      } else if (midPriceTick > maxTickLimit) {
        return maxPrice
      }
    } else {
      if (midPriceTick > maxTickLimit) {
        return maxPrice
      } else if (midPriceTick < minTickLimit) {
        return minPrice
      }
    }

    return Number(midPrice)
  }

  useEffect(() => {
    const midPriceInConcentrationMode = validConcentrationMidPrice(midPriceInput)

    const sqrtPrice = calculateSqrtPriceFromBalance(
      positionOpeningMethod === 'range' ? +midPriceInput : midPriceInConcentrationMode,
      tickSpacing,
      isXtoY,
      xDecimal,
      yDecimal
    )

    const priceTickIndex = calculateTick(sqrtPrice, tickSpacing)

    onChangeMidPrice(BigInt(priceTickIndex), sqrtPrice)
  }, [midPriceInput])

  const setLeftInputValues = (val: string) => {
    setLeftInput(val)
    setLeftInputRounded(toMaxNumericPlaces(+val, 5))
  }

  const setRightInputValues = (val: string) => {
    setRightInput(val)
    setRightInputRounded(toMaxNumericPlaces(+val, 5))
  }

  const onLeftInputChange = (val: string) => {
    setLeftInput(val)
    setLeftInputRounded(val)
  }

  const onRightInputChange = (val: string) => {
    setRightInput(val)
    setRightInputRounded(val)
  }

  const changeRangeHandler = (left: bigint, right: bigint) => {
    setLeftRange(left)
    setRightRange(right)

    setLeftInputValues(calcPriceByTickIndex(left, isXtoY, xDecimal, yDecimal).toString())
    setRightInputValues(calcPriceByTickIndex(right, isXtoY, xDecimal, yDecimal).toString())

    onChangeRange(left, right)
  }

  const resetRange = () => {
    if (positionOpeningMethod === 'range') {
      const higherTick = BigInt(
        Math.max(Number(minTick), Number(midPriceIndex) - Number(tickSpacing) * 10)
      )
      const lowerTick = BigInt(
        Math.min(Number(maxTick), Number(midPriceIndex) + Number(tickSpacing) * 10)
      )
      changeRangeHandler(isXtoY ? higherTick : lowerTick, isXtoY ? lowerTick : higherTick)
    }
  }

  useEffect(() => {
    if (positionOpeningMethod === 'concentration') {
      setConcentrationIndex(0)
      const { leftRange, rightRange } = calculateConcentrationRange(
        tickSpacing,
        concentrationArray[0],
        2,
        validConcentrationMidPriceTick(midPriceIndex, isXtoY, tickSpacing),
        isXtoY
      )

      changeRangeHandler(leftRange, rightRange)
    } else {
      changeRangeHandler(leftRange, rightRange)
    }
  }, [positionOpeningMethod])

  useEffect(() => {
    if (positionOpeningMethod === 'concentration') {
      const index =
        concentrationIndex > concentrationArray.length - 1
          ? concentrationArray.length - 1
          : concentrationIndex
      setConcentrationIndex(index)
      const { leftRange, rightRange } = calculateConcentrationRange(
        tickSpacing,
        concentrationArray[index],
        2,
        validConcentrationMidPriceTick(midPriceIndex, isXtoY, tickSpacing),
        isXtoY
      )
      changeRangeHandler(leftRange, rightRange)
    } else {
      changeRangeHandler(leftRange, rightRange)
    }
  }, [midPriceInput, concentrationArray, midPriceIndex])

  const validateMidPriceInput = (midPriceInput: string) => {
    if (positionOpeningMethod === 'concentration') {
      const validatedMidPrice = validConcentrationMidPrice(midPriceInput)

      const validatedPrice =
        validatedMidPrice < MINIMAL_POOL_INIT_PRICE ? MINIMAL_POOL_INIT_PRICE : validatedMidPrice

      return trimZeros(validatedPrice.toFixed(8))
    } else {
      const minPriceFromTick = isXtoY
        ? calcPriceByTickIndex(minTick, isXtoY, xDecimal, yDecimal)
        : calcPriceByTickIndex(maxTick, isXtoY, xDecimal, yDecimal)

      const maxPriceFromTick = isXtoY
        ? calcPriceByTickIndex(maxTick, isXtoY, xDecimal, yDecimal)
        : calcPriceByTickIndex(minTick, isXtoY, xDecimal, yDecimal)

      const minimalAllowedInput =
        minPriceFromTick < MINIMAL_POOL_INIT_PRICE ? MINIMAL_POOL_INIT_PRICE : minPriceFromTick

      const numericMidPriceInput = parseFloat(midPriceInput)

      const validatedMidPrice = Math.min(
        Math.max(numericMidPriceInput, minimalAllowedInput),
        maxPriceFromTick
      )

      return trimZeros(validatedMidPrice.toFixed(8))
    }
  }

  useEffect(() => {
    if (currentPairReversed !== null) {
      const validatedMidPrice = validateMidPriceInput((1 / +midPriceInput).toString())

      setMidPriceInput(validatedMidPrice)
      changeRangeHandler(rightRange, leftRange)
    }
  }, [currentPairReversed])

  useEffect(() => {
    const validatedMidPrice = validateMidPriceInput(midPriceInput)

    setMidPriceInput(validatedMidPrice)
  }, [positionOpeningMethod])

  const price = useMemo(
    () =>
      Math.min(
        Math.max(
          +midPriceInput,
          Number(calcPriceByTickIndex(isXtoY ? minTick : maxTick, isXtoY, xDecimal, yDecimal))
        ),
        Number(calcPriceByTickIndex(isXtoY ? maxTick : minTick, isXtoY, xDecimal, yDecimal))
      ),
    [midPriceInput, isXtoY, xDecimal, yDecimal]
  )

  const [animatedStartingPrice, setAnimatedStartingPrice] = useState(price)

  useEffect(() => {
    if (formatNumber(price) !== formatNumber(animatedStartingPrice)) {
      setAnimatedStartingPrice(price)
    }
  }, [price])

  return (
    <Grid container direction='column' className={classes.wrapper}>
      <Grid className={classes.topInnerWrapper}>
        <Typography className={classes.header}>Starting price</Typography>
        <Grid className={classes.infoWrapper}>
          <Typography className={classes.info}>
            This pool does not exist yet. To create it, select the fee tier, initial price, and
            enter the amount of tokens. The estimated cost of creating a pool is 0.003 AZERO.
          </Typography>
        </Grid>

        <SimpleInput
          setValue={setMidPriceInput}
          value={midPriceInput}
          decimal={isXtoY ? xDecimal : yDecimal}
          className={classes.midPrice}
          placeholder='0.0'
          onBlur={e => {
            setMidPriceInput(validateMidPriceInput(e.target.value || '0'))
          }}
        />

        <Grid
          className={classes.priceWrapper}
          container
          justifyContent='space-between'
          alignItems='center'>
          <Typography className={classes.priceLabel}>{tokenASymbol} starting price: </Typography>
          <Typography className={classes.priceValue}>
            <span>~</span>
            <AnimatedNumber start={animatedStartingPrice} finish={price} />
            <span> </span>
            {tokenBSymbol}
          </Typography>
        </Grid>
      </Grid>
      <Grid className={classes.bottomInnerWrapper}>
        <Typography className={classes.subheader}>Set price range</Typography>
        <Grid container className={classes.inputs}>
          <RangeInput
            disabled={positionOpeningMethod === 'concentration'}
            className={classes.input}
            label='Min price'
            tokenFromSymbol={tokenASymbol}
            tokenToSymbol={tokenBSymbol}
            currentValue={leftInputRounded}
            setValue={onLeftInputChange}
            decreaseValue={() => {
              const newLeft = isXtoY
                ? Math.max(Number(minTick), Number(leftRange - tickSpacing))
                : Math.min(Number(maxTick), Number(leftRange + tickSpacing))
              changeRangeHandler(BigInt(newLeft), rightRange)
            }}
            increaseValue={() => {
              const newLeft = isXtoY
                ? Math.min(Number(rightRange - tickSpacing), Number(leftRange + tickSpacing))
                : Math.max(Number(rightRange + tickSpacing), Number(leftRange - tickSpacing))
              changeRangeHandler(BigInt(newLeft), rightRange)
            }}
            onBlur={() => {
              const newLeft = isXtoY
                ? Math.min(
                    Number(rightRange - tickSpacing),
                    Number(nearestTickIndex(+leftInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )
                : Math.max(
                    Number(rightRange + tickSpacing),
                    Number(nearestTickIndex(+leftInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )
              changeRangeHandler(BigInt(newLeft), rightRange)
            }}
            diffLabel='Min - Current'
            percentDiff={((+leftInput - price) / price) * 100}
          />
          <RangeInput
            disabled={positionOpeningMethod === 'concentration'}
            className={classes.input}
            label='Max price'
            tokenFromSymbol={tokenASymbol}
            tokenToSymbol={tokenBSymbol}
            currentValue={rightInputRounded}
            setValue={onRightInputChange}
            decreaseValue={() => {
              const newRight = isXtoY
                ? Math.max(Number(rightRange - tickSpacing), Number(leftRange + tickSpacing))
                : Math.min(Number(rightRange + tickSpacing), Number(leftRange - tickSpacing))
              changeRangeHandler(leftRange, BigInt(newRight))
            }}
            increaseValue={() => {
              const newRight = isXtoY
                ? Math.min(Number(maxTick), Number(rightRange + tickSpacing))
                : Math.max(Number(minTick), Number(rightRange - tickSpacing))
              changeRangeHandler(leftRange, BigInt(newRight))
            }}
            onBlur={() => {
              const newRight = isXtoY
                ? Math.max(
                    Number(leftRange + tickSpacing),
                    Number(nearestTickIndex(+rightInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )
                : Math.min(
                    Number(leftRange - tickSpacing),
                    Number(nearestTickIndex(+rightInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )

              changeRangeHandler(leftRange, BigInt(newRight))
            }}
            diffLabel='Max - Current'
            percentDiff={((+rightInput - price) / price) * 100}
          />
        </Grid>
        {positionOpeningMethod === 'concentration' ? (
          <Grid container className={classes.sliderWrapper}>
            <ConcentrationSlider
              valueIndex={concentrationIndex}
              values={concentrationArray}
              valueChangeHandler={value => {
                setConcentrationIndex(value)
                const { leftRange, rightRange } = calculateConcentrationRange(
                  tickSpacing,
                  concentrationArray[value],
                  2,
                  validConcentrationMidPriceTick(midPriceIndex, isXtoY, tickSpacing),
                  isXtoY
                )

                changeRangeHandler(leftRange, rightRange)
              }}
              dragHandler={value => {
                setConcentrationIndex(value)
              }}
              minimumSliderIndex={minimumSliderIndex}
            />
          </Grid>
        ) : (
          <Grid container className={classes.buttons}>
            <Button className={classes.button} onClick={resetRange}>
              Reset range
            </Button>
            <Button
              className={classes.button}
              onClick={() => {
                changeRangeHandler(isXtoY ? minTick : maxTick, isXtoY ? maxTick : minTick)
              }}>
              Set full range
            </Button>
          </Grid>
        )}
      </Grid>
    </Grid>
  )
}

export default PoolInit
