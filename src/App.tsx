import { Provider } from "react-redux";
import { store } from "./store";
import { RouterProvider } from "react-router-dom";
import { router } from "@pages/RouterPages";
import SnackbarProvider from "@components/Snackbar";
import { theme } from "@static/theme";
import { ThemeProvider } from "@mui/material/styles";
import Notifier from "@containers/Notifier";
import { filterConsoleMessages, messagesToHide } from "./hideErrors";
import { AlephiumWalletProvider } from "@alephium/web3-react";
import { web3 } from "@alephium/web3";

filterConsoleMessages(messagesToHide);

web3.setCurrentNodeProvider("https://node.testnet.alephium.org");

function App() {
  return (
    <>
      <AlephiumWalletProvider theme="retro" network="testnet" addressGroup={0}>
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
      </AlephiumWalletProvider>
    </>
  );
}

export default App;
