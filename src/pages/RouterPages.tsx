import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import RootPage from "./RootPage";
import NewPositionPage from "./NewPositionPage";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootPage />}>
      <Route
        path="/newPosition/:item1?/:item2?/:item3?"
        element={<NewPositionPage />}
      />
    </Route>
  )
);
