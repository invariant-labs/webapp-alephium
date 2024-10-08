import type { Meta, StoryObj } from '@storybook/react'
import SelectRPCButton from './SelectRPCButton'
import { Network } from '@invariant-labs/alph-sdk'
import { RPC } from '@store/consts/static'
import { action } from '@storybook/addon-actions'
import { RpcStatus } from '@store/reducers/connection'

const meta = {
  title: 'Buttons/SelectRPCButton',
  component: SelectRPCButton
} satisfies Meta<typeof SelectRPCButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    rpc: RPC.TEST,
    networks: [
      {
        networkType: Network.Testnet,
        rpc: RPC.TEST,
        rpcName: 'Testnet'
      }
    ],
    onSelect: (networkType, rpc) => action('chosen: ' + networkType + ' ' + rpc)(),
    network: Network.Testnet,
    rpcStatus: RpcStatus.Uninitialized
  }
}
