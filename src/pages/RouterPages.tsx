import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import RootPage from "./RootPage";

export const router = createBrowserRouter(
  createRoutesFromElements(<Route path="/" element={<RootPage />}></Route>)
);
