import { StrikerDraftProvider } from "@/features/striker-draft/context/StrikerDraftContext";
import { Outlet } from "react-router-dom";

export default function StrikerDraft() {
  return (
    <StrikerDraftProvider>
      <Outlet />
    </StrikerDraftProvider>
  );
}
