import React, { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
// import EventsHandlers from "@containers/EventHandlers/index";
// import FooterWrapper from "@containers/FooterWrapper";
import HeaderWrapper from "@containers/HeaderWrapper/HeaderWrapper";
import { Grid } from "@mui/material";
import {
  // Status,
  actions as alephiumConnectionActions,
} from "@store/reducers/connection";
// import { status as connectionStatus } from "@store/selectors/connection";
import { toBlur } from "@utils/uiUtils";
import useStyles from "./style";

const RootPage: React.FC = React.memo(() => {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const location = useLocation();

  const { classes } = useStyles();

  const initConnection = useCallback(() => {
    dispatch(alephiumConnectionActions.initAlephiumConnection());
  }, [dispatch]);

  useEffect(() => {}, [location.pathname, navigate]);

  useEffect(() => {
    initConnection();
  }, [initConnection]);

  return (
    <>
      <div id={toBlur}>
        <Grid className={classes.root}>
          <HeaderWrapper />
          <Grid className={classes.body}>
            <Outlet />
          </Grid>
        </Grid>
      </div>
    </>
  );
});

export default RootPage;
