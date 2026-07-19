import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router";

import { App } from "./App.js";
import { LibraryScreen } from "./LibraryScreen.js";
import { ReaderScreen } from "./ReaderScreen.js";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <Navigate replace to="/library" /> },
      { path: "library", element: <LibraryScreen /> },
      { path: "books/:bookId/folios/:folioId", element: <ReaderScreen /> },
      { path: "*", element: <Navigate replace to="/library" /> },
    ],
  },
]);
const root = document.querySelector("#root");
if (root === null) throw new Error("reader root is missing");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
