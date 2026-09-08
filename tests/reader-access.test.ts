import { describe, it, expect } from "vitest";
import { readerAccess } from "../src/reader-access.js";
const secret = "a-test-signing-secret-at-least-32-characters";
function gate() {
  const app = readerAccess("test-reader-password", secret);
  app.get("/api/works/example", c => c.json({ title: "A book" }));
  app.get("/api/assets/example", c => c.text("image"));
  app.get("/healthz", c => c.text("ok"));
  return app;
}
describe("shared reading password", () => {
  it("protects story and asset URLs while allowing the health check", async () => {
    const app = gate();
    expect((await app.request("/api/works/example")).status).toBe(401);
    expect((await app.request("/api/assets/example")).status).toBe(401);
    expect((await app.request("/healthz")).status).toBe(200);
  });
  it("rejects an incorrect password, accepts the right one and rejects a forged cookie", async () => {
    const app = gate();
    const login = (password: string) => app.request("https://book.test/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    expect((await login("incorrect")).status).toBe(401);
    const response = await login("test-reader-password");
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("Secure"); expect(cookie).toContain("SameSite=Lax");
    const allowed = await app.request("/api/works/example", { headers: { Cookie: cookie.split(";")[0] } });
    expect(await allowed.json()).toEqual({ title: "A book" });
    expect((await app.request("/api/works/example", { headers: { Cookie: "book_access=forged" } })).status).toBe(401);
  });
});
