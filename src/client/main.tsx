import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { App } from "./App.js";

const router = createBrowserRouter([{ path: "*", element: <App /> }]);
const root = document.querySelector("#root");
if (root === null) throw new Error("reader root is missing");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
