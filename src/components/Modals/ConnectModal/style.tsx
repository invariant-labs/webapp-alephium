import { colors, typography } from "@static/theme";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()(() => {
  return {
    paper: {
      background: "transparent",
      boxShadow: "none",
    },
    popover: {
      marginTop: "calc(50vh - 88px)",
      marginLeft: "calc(50vw - 116px)",
    },
    modal: {
      background: colors.invariant.component,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 16,
      borderRadius: 20,
    },
    title: {
      ...typography.heading4,
      textAlign: "center",
    },
    button: {
      height: 40,
      width: 200,
      background: colors.invariant.pinkLinearGradientOpacity,
      color: colors.invariant.newDark,
      borderRadius: 14,
      ...typography.body1,
      textTransform: "none",

      "&:hover": {
        boxShadow: `0 0 15px ${colors.invariant.light}`,
        backgroundColor: colors.invariant.light,
      },
    },
  };
});

export default useStyles;
