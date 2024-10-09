import { colors, theme, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(() => {
  return {
    paper: {
      background: 'transparent',
      boxShadow: 'none'
    },
    popover: {
      marginTop: 'calc(50vh - 197px)',
      marginLeft: 'calc(50vw - 157px)',

      [theme.breakpoints.up('md')]: {
        marginTop: 'calc(50vh - 144px)',
        marginLeft: 'calc(50vw - 279px)'
      }
    },
    modal: {
      background: colors.invariant.component,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      borderRadius: 24
    },
    title: {
      ...typography.heading2,
      textAlign: 'center',

      [theme.breakpoints.down('md')]: {
        ...typography.heading3,
        textAlign: 'left'
      }
    },
    buttonsDescription: {
      ...typography.body2,
      textAlign: 'center',
      color: colors.invariant.textGrey
    },
    closeIcon: {
      position: 'absolute',
      top: 24,
      right: 24,
      cursor: 'pointer'
    },
    button: {
      height: 28,
      width: '100%',
      background: colors.invariant.light,
      color: colors.white.main,
      borderRadius: 8,
      ...typography.body2,
      textTransform: 'none',
      display: 'flex',
      gap: 12,

      '&:hover': {
        boxShadow: `0 0 15px ${colors.invariant.light}`,
        backgroundColor: colors.invariant.light
      }
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32,

      [theme.breakpoints.up('md')]: {
        flexDirection: 'row'
      }
    },
    buttonsPanel: {
      width: 180,
      background: colors.invariant.newDark,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 8,
      borderRadius: 8,
      flexShrink: 0,

      [theme.breakpoints.down('md')]: {
        width: 250
      }
    },
    infoPanel: {
      width: 250,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 24,
      flexShrink: 0
    },
    line: {
      borderLeft: `1px solid ${colors.invariant.light}`,

      [theme.breakpoints.down('md')]: {
        borderLeft: 0,
        borderTop: `1px solid ${colors.invariant.light}`
      }
    },
    infoContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      textAlign: 'center'
    },
    infoTitle: {
      color: colors.invariant.green,
      ...typography.heading4
    },
    infoDescription: {
      ...typography.body2
    },
    infoButton: {
      height: 46,
      width: 250,
      background: colors.invariant.pinkLinearGradientOpacity,
      color: colors.invariant.newDark,
      borderRadius: 14,
      ...typography.body1,
      textTransform: 'none',

      '&:hover': {
        boxShadow: `0 0 15px ${colors.invariant.light}`,
        backgroundColor: colors.invariant.light
      }
    },
    infoLoadingContainer: {
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column'
    },
    spinnerContainer: {
      width: 100,
      height: 100,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    spinner: {
      animation: 'spin 2s linear infinite',
      '@keyframes spin': {
        '0%': {
          transform: 'rotate(360deg)'
        },
        '100%': {
          transform: 'rotate(0deg)'
        }
      }
    },
    gradient: {
      borderRadius: 24,
      padding: 24,
      background:
        'radial-gradient(circle at top, rgba(239, 132, 245, 0.05), rgba(239, 132, 245, 0)), radial-gradient(circle at bottom, rgba(46, 224, 154, 0.05), rgba(46, 224, 154, 0))',
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }
  }
})

export default useStyles
