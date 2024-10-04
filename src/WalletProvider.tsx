import {
  AlephiumConnectProvider,
  ConnectSettingProvider,
} from "@alephium/web3-react";

const network = "testnet";
const addressGroup: number | undefined = 0;

export const WalletProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AlephiumConnectProvider network={network} addressGroup={addressGroup}>
      <ConnectSettingProvider>{children}</ConnectSettingProvider>
    </AlephiumConnectProvider>
  );
};
