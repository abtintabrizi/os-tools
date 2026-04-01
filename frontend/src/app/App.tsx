import { router } from "@/app/router";
import { RouterProvider } from "react-router-dom";
import { ToastProvider } from "@/common/components/Toast";
import "@/index.css";

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
