import { Box, Button, Popover, Typography, useMediaQuery } from '@mui/material'
import useStyles from './style'
import { theme } from '@static/theme'
import icons from '@static/icons'

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
        <Box className={classes.gradient}>
          <Typography className={classes.title}>Connect your wallet</Typography>
          <img
            className={classes.closeIcon}
            src={icons.closeSmallIcon}
            alt='Close icon'
            onClick={handleClose}
          />
          <Box className={classes.container}>
            <Box className={classes.buttonsPanel}>
              <Typography className={classes.buttonsDescription}>
                Choose and connect to one of the available wallets:
              </Typography>
              {!isMdDown && (
                <>
                  <Button className={classes.button} onClick={() => onConnectWallet('injected')}>
                    <img src={icons.alephiumLogoToned} alt='Alephium logo' />
                    Extension Wallet
                  </Button>
                  <Button
                    className={classes.button}
                    onClick={() => onConnectWallet('desktopWallet')}>
                    <img src={icons.alephiumLogoToned} alt='Alephium logo' />
                    Desktop Wallet
                  </Button>
                </>
              )}
              <Button className={classes.button} onClick={() => onConnectWallet('walletConnect')}>
                <img src={icons.walletConnectLogoToned} alt='Wallet connect logo' />
                Wallet Connect
              </Button>
            </Box>
            <div className={classes.line}></div>
            <Box className={classes.infoPanel}>
              {connecting ? (
                <>
                  <Box className={classes.spinnerContainer}>
                    <svg width='96' height='96' className={classes.spinner}>
                      <circle
                        stroke='#3A466B'
                        strokeWidth='8'
                        fill='transparent'
                        r='24'
                        cx='48'
                        cy='48'
                      />
                      <circle
                        strokeDasharray='32 200'
                        stroke='#EF84F5'
                        strokeWidth='8'
                        fill='transparent'
                        r='24'
                        cx='48'
                        cy='48'
                      />
                    </svg>
                  </Box>
                  <Box className={classes.infoLoadingContainer}>
                    <Typography className={classes.infoTitle}>Please wait!</Typography>
                    <Typography className={classes.infoDescription}>
                      We are connecting with your wallet!
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <Box className={classes.infoContainer}>
                    <Typography className={classes.infoTitle}>
                      You don't have a wallet yet?
                    </Typography>
                    <Typography className={classes.infoDescription}>Get one down below!</Typography>
                  </Box>
                  <a href='https://alephium.org/#wallets' target='_blank'>
                    <Button className={classes.infoButton}>Get your wallet now!</Button>
                  </a>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Popover>
  )
}
