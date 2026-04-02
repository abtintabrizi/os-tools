import { MapDraftProvider } from "@/features/map-drafter/context/MapDraftContext";
import { Outlet } from "react-router-dom";

export default function StrikerDraft() {
  return (
    <MapDraftProvider>
      <Outlet />
    </MapDraftProvider>
  );
}
