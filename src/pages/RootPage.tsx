import React, { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import EventsHandlers from "@containers/EventHandlers/index";
import FooterWrapper from "@containers/FooterWrapper";
import HeaderWrapper from "@containers/HeaderWrapper/HeaderWrapper";
import { Grid } from "@mui/material";
import { actions as alephiumConnectionActions } from "@store/reducers/connection";
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

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/exchange");
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    initConnection();
  }, [initConnection]);

  return (
    <>
      <div id={toBlur}>
        <EventsHandlers />
        <Grid className={classes.root}>
          <HeaderWrapper />
          <Grid className={classes.body}>
            <Outlet />
          </Grid>
          <FooterWrapper />
        </Grid>
      </div>
    </>
  );
});

export default RootPage;
