import { Outlet } from "react-router-dom";
import { MapDraftProvider } from "@/features/map-drafter/context/MapDraftContext";

export default function MapDraft() {
  return (
    <MapDraftProvider>
      <Outlet />
    </MapDraftProvider>
  );
}
