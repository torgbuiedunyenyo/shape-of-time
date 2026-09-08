import { app } from "./server/app.js";
import { readerAccess } from "./reader-access.js";
const originalFetch = app.fetch;
const gate = readerAccess(process.env.READER_PASSWORD ?? "", process.env.READER_COOKIE_SECRET ?? "");
gate.all("*", c => originalFetch(c.req.raw));
app.fetch = gate.fetch;
