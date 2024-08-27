import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { MemoryRouter } from 'react-router-dom'
import SinglePositionPlot from './SinglePositionPlot'

const meta = {
  title: 'Components/SinglePositionPlot',
  component: SinglePositionPlot,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ]
} satisfies Meta<typeof SinglePositionPlot>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    currentPrice: 10000 as any,
    data: [{ x: 0, y: 0, index: 0 as any }],
    leftRange: {
      index: 2 as any,
      x: 10000 as any
    },
    rightRange: {
      index: 2 as any,
      x: 10000 as any
    },
    max: 100,
    min: 0,
    midPrice: {} as any,
    reloadHandler: fn(),
    ticksLoading: false,
    tickSpacing: 1 as any,
    tokenX: {
      name: 'BTC',
      decimal: 9 as any
    },
    tokenY: {
      name: 'ETH',
      decimal: 12 as any
    },
    xToY: true,
    hasTicksError: false
  },
  render: args => {
    return (
      <SinglePositionPlot
        {...args}
        currentPrice={10000}
        leftRange={{
          index: 2n,
          x: 10000
        }}
        rightRange={{
          index: 2n,
          x: 10000
        }}
        midPrice={{
          index: 2n,
          x: 1020
        }}
        tokenX={{
          name: 'BTC',
          decimal: 9n
        }}
        tokenY={{
          name: 'ETH',
          decimal: 12n
        }}
        tickSpacing={1n}
        data={[{ x: 0, y: 0, index: 0n }]}
      />
    )
  }
}
