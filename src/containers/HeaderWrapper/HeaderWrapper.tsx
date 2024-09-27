import Header from "@components/Header/Header";
import { Network } from "@invariant-labs/alph-sdk";
import { RPC, CHAINS } from "@store/consts/static";
import { actions } from "@store/reducers/connection";
import { Status, actions as walletActions } from "@store/reducers/wallet";
import { networkType, rpcAddress } from "@store/selectors/connection";
import { address, status } from "@store/selectors/wallet";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { actions as snackbarsActions } from "@store/reducers/snackbars";
import { Chain } from "@store/consts/types";
import { useConnect, useWallet } from "@alephium/web3-react";
import { web3 } from "@alephium/web3";

export const HeaderWrapper: React.FC = () => {
  const dispatch = useDispatch();
  const walletStatus = useSelector(status);
  const currentNetwork = useSelector(networkType);
  const currentRpc = useSelector(rpcAddress);
  const location = useLocation();
  const walletAddress = useSelector(address);
  const navigate = useNavigate();
  const { connect, disconnect } = useConnect();
  const { signer, account } = useWallet();
  const [wasEagerConnect, setWasEagerConnect] = useState(true);

  useEffect(() => {
    if (account && signer) {
      dispatch(
        walletActions.connect({
          isEagerConnect: wasEagerConnect,
          signer,
        })
      );
    }

    if (!account && !signer) {
      dispatch(walletActions.disconnect());
    }
  }, [account, signer]);

  const defaultTestnetRPC = useMemo(() => {
    const lastRPC = localStorage.getItem(
      `INVARIANT_RPC_Alephium_${Network.Testnet}`
    );

    if (lastRPC === null) {
      localStorage.setItem(
        `INVARIANT_RPC_Alephium_${Network.Testnet}`,
        RPC.TEST
      );
    }

    return lastRPC === null ? RPC.TEST : lastRPC;
  }, []);

  const defaultMainnetRPC = useMemo(() => {
    const lastRPC = localStorage.getItem(
      `INVARIANT_RPC_Alephium_${Network.Mainnet}`
    );

    if (lastRPC === null) {
      localStorage.setItem(
        `INVARIANT_RPC_Alephium_${Network.Mainnet}`,
        RPC.MAIN
      );
    }

    return lastRPC === null ? RPC.MAIN : lastRPC;
  }, []);

  const activeChain =
    CHAINS.find((chain) => chain.name === Chain.Alephium) ?? CHAINS[0];

  return (
    <Header
      address={walletAddress}
      onNetworkSelect={(network, rpcAddress) => {
        if (rpcAddress !== currentRpc) {
          localStorage.setItem(`INVARIANT_RPC_Alephium_${network}`, rpcAddress);
          dispatch(actions.setRPCAddress(rpcAddress));
          web3.setCurrentNodeProvider(rpcAddress);
        }

        if (network !== currentNetwork) {
          if (location.pathname.startsWith("/exchange")) {
            navigate("/exchange");
          }

          if (location.pathname.startsWith("/newPosition")) {
            navigate("/newPosition");
          }

          dispatch(actions.setNetwork(network));
        }
      }}
      onConnectWallet={async () => {
        setWasEagerConnect(false);
        await connect();
      }}
      landing={location.pathname.substring(1)}
      walletConnected={walletStatus === Status.Initialized}
      onDisconnectWallet={async () => {
        await disconnect();
      }}
      onFaucet={() => {
        dispatch(walletActions.airdrop());
      }}
      typeOfNetwork={currentNetwork}
      rpc={currentRpc}
      defaultTestnetRPC={defaultTestnetRPC}
      onCopyAddress={() => {
        navigator.clipboard.writeText(walletAddress);

        dispatch(
          snackbarsActions.add({
            message: "Wallet address copied.",
            variant: "success",
            persist: false,
          })
        );
      }}
      onChangeWallet={() => {
        dispatch(walletActions.reconnect());
      }}
      activeChain={activeChain}
      onChainSelect={(chain) => {
        if (chain.name !== activeChain.name) {
          window.location.replace(chain.address);
        }
      }}
      network={currentNetwork}
      defaultMainnetRPC={defaultMainnetRPC}
    />
  );
};

export default HeaderWrapper;
