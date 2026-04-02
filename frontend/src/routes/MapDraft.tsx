import { Outlet } from "react-router-dom";
import { MapDraftProvider } from "@/features/map-drafter/context/MapDraftContext";

export default function MapDrafter() {
  return (
    <MapDraftProvider>
      <Outlet />
    </MapDraftProvider>
  );
}
