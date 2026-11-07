import { Outlet } from "react-router-dom";

import { StrikerDraftProvider } from "../features/striker-draft/context/StrikerDraftContext";

export default function StrikerDraft() {
  return (
    <StrikerDraftProvider>
      <Outlet />
    </StrikerDraftProvider>
  );
}
