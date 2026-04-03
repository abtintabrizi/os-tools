import { createBrowserRouter } from "react-router-dom";
import Home from "@/routes/Home";
import MapDraft from "@/routes/MapDraft";
import StrikerDraft from "@/routes/StrikerDraft";
import MapDraftPages from "@/features/map-drafter/pages";
import StrikerDraftPages from "@/features/striker-draft/pages";

export const router = createBrowserRouter([
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
