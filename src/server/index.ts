import { serve } from "@hono/node-server";

import { composeApplication } from "./app.js";

const runtime = composeApplication(process.env);

const server = serve({ fetch: runtime.app.fetch, hostname: runtime.config.host, port: runtime.config.port }, (info) => {
  runtime.logger.info({ address: info.address, port: info.port }, "Shape of Time reader listening");
});

async function close(signal: string): Promise<void> {
  runtime.logger.info({ signal }, "shutting down");
  server.close(() => {
    void runtime.close().then(
      () => process.exit(0),
      (error: unknown) => {
        runtime.logger.error({ err: error }, "database shutdown failed");
        process.exit(1);
      },
    );
  });
}

process.once("SIGINT", () => void close("SIGINT"));
process.once("SIGTERM", () => void close("SIGTERM"));
