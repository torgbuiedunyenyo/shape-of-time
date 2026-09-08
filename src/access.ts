import { app } from "./server/app.js";
import { readerAccess } from "./reader-access.js";
import { readingWait } from "./reading-wait.js";
const originalFetch = app.fetch;
const gate = readerAccess(process.env.READER_PASSWORD ?? "", process.env.READER_COOKIE_SECRET ?? "");
// Read-only reading-interface telemetry stays outside the creative mechanism.
gate.get("/api/reading-wait/:id", async c => {
  const estimate = await readingWait(c.req.param("id"));
  return estimate ? c.json(estimate) : c.json({ error: "This opening could not be found." }, 404);
});
gate.all("*", c => originalFetch(c.req.raw));
app.fetch = gate.fetch;
