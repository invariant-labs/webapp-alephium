import { Button, Grid, Popover, Typography } from "@mui/material";
import useStyles from "./style";

export interface Props {
  open: boolean;
  handleClose: () => void;
  onConnectWallet: (id: "injected" | "walletConnect" | "desktopWallet") => void;
}

export const ConnectModal: React.FC<Props> = ({
  open,
  handleClose,
  onConnectWallet,
}) => {
  const { classes } = useStyles();

  return (
    <Popover
      open={open}
      className={classes.popover}
      classes={{ paper: classes.paper }}
      onClose={handleClose}
      anchorReference="none"
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      <Grid className={classes.modal}>
        <Typography className={classes.title}>Select wallet</Typography>
        <Button
          className={classes.button}
          onClick={() => onConnectWallet("injected")}
        >
          Extension Wallet
        </Button>
        <Button
          className={classes.button}
          onClick={() => onConnectWallet("walletConnect")}
        >
          Wallet Connect
        </Button>
        <Button
          className={classes.button}
          onClick={() => onConnectWallet("desktopWallet")}
        >
          Desktop Wallet
        </Button>
      </Grid>
    </Popover>
  );
};
