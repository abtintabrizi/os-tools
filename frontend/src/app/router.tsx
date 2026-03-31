import { createBrowserRouter } from "react-router-dom";
import Home from "@/routes/Home";
import MapDraft from "@/routes/MapDraft";
import SetupPage from "@/features/map-drafter/pages/SetupPage";
import LobbyPage from "@/features/map-drafter/pages/LobbyPage";
import DraftPage from "@/features/map-drafter/pages/DraftPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/map-draft",
    element: <MapDraft />,
    children: [
      { path: "", element: <SetupPage /> },
      { path: "lobby", element: <LobbyPage /> },
      { path: "draft", element: <DraftPage /> },
    ],
  },
]);
