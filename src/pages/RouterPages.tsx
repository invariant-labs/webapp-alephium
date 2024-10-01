import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import RootPage from "./RootPage";
import NewPositionPage from "./NewPositionPage";
import ListPage from "./ListPage";
import SinglePositionPage from "./SinglePositionPage";
import SwapPage from "./SwapPage";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootPage />}>
      <Route path="/exchange/:item1?/:item2?" element={<SwapPage />} />
      <Route path="/liquidity" element={<ListPage />} />
      <Route
        path="/newPosition/:item1?/:item2?/:item3?"
        element={<NewPositionPage />}
      />
      <Route path="/position/:address/:id" element={<SinglePositionPage />} />
      <Route path="*" element={<Navigate to="/exchange" replace />} />
    </Route>
  )
);
