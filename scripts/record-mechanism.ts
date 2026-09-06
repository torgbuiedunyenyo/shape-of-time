import { mkdir, writeFile } from "node:fs/promises";
import { mechanismFiles } from "../src/server/mechanism.js";
await mkdir("dist/server", { recursive: true });
await writeFile("dist/server/mechanism.json", JSON.stringify(await mechanismFiles(), null, 2));
