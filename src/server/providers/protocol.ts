import { createHash } from "node:crypto";
import { getBytes, putBytes } from "../library/assets.js";

const hash = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const reference = /^stored-image:([^:]+):([a-f0-9]{64})$/;
const stored = new Map<string, Promise<string>>();

async function mapImages<T>(
  value: T,
  image: (url: string) => Promise<string>,
): Promise<T> {
  const walk = async (item: unknown): Promise<unknown> => {
    if (Array.isArray(item)) return Promise.all(item.map(walk));
    if (!item || typeof item !== "object") return item;
    return Object.fromEntries(
      await Promise.all(
        Object.entries(item).map(async ([key, child]) => [
          key,
          key === "image_url" && typeof child === "string"
            ? await image(child)
            : await walk(child),
        ]),
      ),
    );
  };
  return (await walk(value)) as T;
}

/** Lossless storage representation. Only image bytes move out of the protocol; items stay intact. */
export async function storeImages<T>(value: T): Promise<T> {
  return mapImages(value, async (url) => {
    const data = /^data:([^;]+);base64,([\s\S]+)$/.exec(url);
    if (!data) return url;
    const bytes = Buffer.from(data[2], "base64");
    const sha = hash(bytes),
      ref = `stored-image:${data[1]}:${sha}`;
    if (!stored.has(ref))
      stored.set(
        ref,
        putBytes(`protocol_images/${sha}`, bytes, data[1])
          .then(() => ref)
          .catch((error) => {
            stored.delete(ref);
            throw error;
          }),
      );
    return stored.get(ref)!;
  });
}

/** Provider calls always receive actual image data, never these private storage references. */
export async function hydrateImages<T>(value: T): Promise<T> {
  const loaded = new Map<string, Promise<string>>();
  return mapImages(value, async (url) => {
    const parts = reference.exec(url);
    if (!parts) return url;
    if (!loaded.has(url))
      loaded.set(
        url,
        (async () => {
          const bytes = await getBytes(`protocol_images/${parts[2]}`);
          if (hash(bytes) !== parts[2])
            throw new Error("A stored conversation image failed its checksum.");
          return `data:${parts[1]};base64,${bytes.toString("base64")}`;
        })(),
      );
    return loaded.get(url)!;
  });
}

/** Includes every referenced original in a corpus snapshot, including unpublished image crops. */
export function protocolImageObjects(value: unknown) {
  const objects = new Map<string, string>();
  const walk = (item: unknown) => {
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item)) {
      const parts =
        key === "image_url" && typeof child === "string"
          ? reference.exec(child)
          : null;
      if (parts) objects.set(`protocol_images/${parts[2]}`, parts[1]);
      else walk(child);
    }
  };
  walk(value);
  return objects;
}
