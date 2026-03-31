import { router } from "@/app/router";
import { RouterProvider } from "react-router-dom";
import "@/index.css";

export default function App() {
  return (
    <>
      <div className="grid-bg" />
      <RouterProvider router={router} />
    </>
  );
}
