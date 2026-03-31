import { Outlet } from "react-router-dom";
import { DraftProvider } from "@/features/map-drafter/context/DraftContext";

export default function MapDrafter() {
  return (
    <DraftProvider>
      <Outlet />
    </DraftProvider>
  );
}
