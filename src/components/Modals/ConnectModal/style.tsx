import { colors, theme, typography } from "@static/theme";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()(() => {
  return {
    paper: {
      background: "transparent",
      boxShadow: "none",
    },
    popover: {
      marginTop: "calc(50vh - 184px)",
      marginLeft: "calc(50vw - 160px)",

      [theme.breakpoints.up("md")]: {
        marginTop: "calc(50vh - 134px)",
        marginLeft: "calc(50vw - 276px)",
      },
    },
    modal: {
      background: colors.invariant.component,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 32,
      borderRadius: 20,
    },
    title: {
      ...typography.heading4,
      marginBottom: 16,
    },
    button: {
      height: 40,
      width: "100%",
      background: colors.invariant.pinkLinearGradientOpacity,
      color: colors.invariant.newDark,
      borderRadius: 14,
      ...typography.body1,
      textTransform: "none",

      "&:hover": {
        boxShadow: `0 0 15px ${colors.invariant.light}`,
        backgroundColor: colors.invariant.light,
      },

      [theme.breakpoints.up("md")]: {
        width: 200,
      },
    },
    container: {
      display: "flex",
      flexDirection: "column",
      gap: 32,

      [theme.breakpoints.up("md")]: {
        flexDirection: "row",
      },
    },
    leftPanel: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
    },
    rightPanel: {
      width: 256,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    description: {
      ...typography.body2,
    },
    otherButton: {
      height: 40,
      width: 200,
      background: colors.invariant.light,
      color: colors.white.main,
      borderRadius: 14,
      ...typography.body1,
      textTransform: "none",

      "&:hover": {
        boxShadow: `0 0 15px ${colors.invariant.light}`,
        backgroundColor: colors.invariant.light,
      },
    },
    spinner: {
      animation: "spin 2s linear infinite",
      "@keyframes spin": {
        "0%": {
          transform: "rotate(360deg)",
        },
        "100%": {
          transform: "rotate(0deg)",
        },
      },
    },
  };
});

export default useStyles;
