import { Box, Button, Popover, Typography, useMediaQuery } from '@mui/material'
import useStyles from './style'
import { theme } from '@static/theme'

export interface Props {
  open: boolean
  handleClose: () => void
  onConnectWallet: (id: 'injected' | 'walletConnect' | 'desktopWallet') => void
  connecting: boolean
}

export const ConnectModal: React.FC<Props> = ({
  open,
  handleClose,
  onConnectWallet,
  connecting
}) => {
  const { classes } = useStyles()

  const isMdDown = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Popover
      open={open}
      className={classes.popover}
      classes={{ paper: classes.paper }}
      onClose={handleClose}
      anchorReference='none'
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}>
      <Box className={classes.modal}>
        <Typography className={classes.title}>Connect wallet</Typography>
        <Box className={classes.container}>
          <Box className={classes.leftPanel}>
            {!isMdDown && (
              <Button className={classes.button} onClick={() => onConnectWallet('injected')}>
                Extension Wallet
              </Button>
            )}
            <Button className={classes.button} onClick={() => onConnectWallet('walletConnect')}>
              Wallet Connect
            </Button>
            {!isMdDown && (
              <Button className={classes.button} onClick={() => onConnectWallet('desktopWallet')}>
                Desktop Wallet
              </Button>
            )}
          </Box>
          <Box className={classes.rightPanel}>
            {connecting ? (
              <>
                <svg width='48' height='48' className={classes.spinner}>
                  <circle
                    stroke='#3A466B'
                    strokeWidth='4'
                    fill='transparent'
                    r='12'
                    cx='24'
                    cy='24'
                  />
                  <circle
                    strokeDasharray='20 100'
                    stroke='#EF84F5'
                    strokeWidth='4'
                    fill='transparent'
                    r='12'
                    cx='24'
                    cy='24'
                  />
                </svg>
                <Typography className={classes.description}>Connecting wallet...</Typography>
              </>
            ) : (
              <>
                <Typography className={classes.description}>
                  You need a wallet to connect to the app.
                </Typography>
                <a href='https://alephium.org/#wallets' target='_blank'>
                  <Button className={classes.otherButton}>Get a wallet</Button>
                </a>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Popover>
  )
}
