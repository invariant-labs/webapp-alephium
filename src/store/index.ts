import { configureStore } from "@reduxjs/toolkit";
import combinedReducers from "./reducers";

const configureAppStore = () => {
  const store = configureStore({ reducer: combinedReducers });

  return store;
};

export const store = configureAppStore();
