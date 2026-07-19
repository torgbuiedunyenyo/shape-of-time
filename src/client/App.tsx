import { Outlet } from "react-router";

import { ReaderStoreProvider } from "./reader/reader-store.js";
import "./styles.css";

export function App() {
  return (
    <ReaderStoreProvider>
      <Outlet />
    </ReaderStoreProvider>
  );
}
