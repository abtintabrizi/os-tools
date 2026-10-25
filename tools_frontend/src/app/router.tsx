import { createBrowserRouter } from "react-router-dom";

import MapDraftPages from "../features/map-drafter/pages";
import StrikerDraftPages from "../features/striker-draft/pages";
import TacticsPage from "../features/tactics/pages/TacticsPage";
import Home from "./Home";
import MapDraft from "./MapDraft";
import StrikerDraft from "./StrikerDraft";

export const router = createBrowserRouter([
  { path: "/tactics", element: <TacticsPage /> },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/map-draft",
    element: <MapDraft />,
    children: [
      { path: "", element: <MapDraftPages.SetupPage /> },
      { path: "lobby", element: <MapDraftPages.LobbyPage /> },
      { path: "draft", element: <MapDraftPages.DraftPage /> },
    ],
  },
  {
    path: "/striker-draft",
    element: <StrikerDraft />,
    children: [
      { path: "", element: <StrikerDraftPages.SetupPage /> },
      { path: "lobby", element: <StrikerDraftPages.LobbyPage /> },
      { path: "draft", element: <StrikerDraftPages.DraftPage /> },
    ],
  },
]);
