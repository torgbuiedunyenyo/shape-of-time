import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { config } from "./config.js";
import { migrate } from "./db/migrate.js";
import { initializeEdition } from "./library/store.js";
await migrate();
await initializeEdition();
serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" });
console.log(
  `Reader listening on ${config.port}; generation ${config.generationEnabled ? "enabled" : "paused"}.`,
);
if (config.generationEnabled) {
  const { pump } = await import("./agent/runner.js");
  void pump().catch((e) => console.error("Work pump:", e.message));
  setInterval(
    () => void pump().catch((e) => console.error("Work pump:", e.message)),
    3000,
  );
}
