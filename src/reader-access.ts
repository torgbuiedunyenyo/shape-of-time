import { Hono } from "hono";
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import { createHash, timingSafeEqual } from "node:crypto";

/** A reading-interface gate, separate from the creative runtime and its mechanism. */
export function readerAccess(password: string, secret: string) {
  if (password && secret.length < 32) throw new Error("READER_COOKIE_SECRET must have at least 32 characters");
  const gate = new Hono();
  const cookieName = "book_access";
  const version = createHash("sha256").update(password).digest("hex");
  gate.use("/api/*", async (c, next) => {
    c.header("Cache-Control", "private, no-store");
    if (!password || c.req.path === "/api/access") return next();
    const value = await getSignedCookie(c, secret, cookieName);
    const expires = typeof value === "string" ? Number(value.split(":")[1]) : 0;
    if (typeof value !== "string" || !value.startsWith(version + ":") || expires <= Date.now())
      return c.json({ error: "Enter the password to open the book." }, 401);
    return next();
  });
  gate.post("/api/access", async c => {
    if (!password) return c.json({ ok: true });
    if (c.req.header("origin") && new URL(c.req.header("origin")!).host !== new URL(c.req.url).host)
      return c.json({ error: "Please open the book directly." }, 403);
    const body = await c.req.json().catch(() => null);
    const supplied = typeof body?.password === "string" ? body.password : "";
    if (!timingSafeEqual(createHash("sha256").update(supplied).digest(), createHash("sha256").update(password).digest()))
      return c.json({ error: "That password isn’t right. Please try again." }, 401);
    const lifetime = 30 * 24 * 60 * 60;
    await setSignedCookie(c, cookieName, `${version}:${Date.now() + lifetime * 1000}`, secret, {
      path: "/", httpOnly: true, secure: new URL(c.req.url).protocol === "https:" || Boolean(process.env.RAILWAY_ENVIRONMENT_ID), sameSite: "Lax", maxAge: lifetime,
    });
    return c.json({ ok: true });
  });
  return gate;
}
