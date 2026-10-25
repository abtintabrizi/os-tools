import "../index.css";

import { RouterProvider } from "react-router-dom";

import { ToastProvider } from "../features/common/components/Toast";
import { router } from "./router";

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
