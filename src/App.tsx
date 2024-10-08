import { Provider } from 'react-redux'
import { store } from './store'
import { RouterProvider } from 'react-router-dom'
import { router } from '@pages/RouterPages'
import SnackbarProvider from '@components/Snackbar'
import { theme } from '@static/theme'
import { ThemeProvider } from '@mui/material/styles'
import Notifier from '@containers/Notifier'
import { filterConsoleMessages, messagesToHide } from './hideErrors'
import { WalletProvider } from './WalletProvider'
import { Network } from '@invariant-labs/alph-sdk'
import { RPC } from '@store/consts/static'
import { web3 } from '@alephium/web3'

const originalWindowOpen = window.open
;(window as any).open = (
  url: string | URL,
  target?: string,
  features?: string
): WindowProxy | null => {
  const newWindow = originalWindowOpen.call(this, url, target, features)

  if (url.toString().startsWith('alephium://')) {
    ;(window as any).alephiumDesktopWalletWindow = newWindow
  }

  return newWindow
}

filterConsoleMessages(messagesToHide)

const network =
  Network[localStorage.getItem('INVARIANT_NETWORK_Alephium') as keyof typeof Network] ??
  Network.Testnet
const rpcAddress = localStorage.getItem(`INVARIANT_RPC_Alephium_${network}`) ?? RPC.TEST
web3.setCurrentNodeProvider(rpcAddress)

function App() {
  return (
    <WalletProvider>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <SnackbarProvider maxSnack={99}>
            <>
              <Notifier />
              <RouterProvider router={router} />
            </>
          </SnackbarProvider>
        </ThemeProvider>
      </Provider>
    </WalletProvider>
  )
}

export default App
