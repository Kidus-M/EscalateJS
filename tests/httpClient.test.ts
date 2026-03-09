import { HttpClient } from "../src/httpClient";
import { OAuth2Token } from "../src/tokens";
import { describe, test, expect } from "vitest";

describe("HttpClient OAuth2 behavior", () => {
  test("api=true sets Authorization header when token is valid", () => {
    const c = new HttpClient();
    c.oauth2Token = new OAuth2Token("ok", Math.floor(Date.now() / 1000) + 3600);

    const resp = c.request("GET", "/me", { api: true });

    expect(resp.headers.Authorization).toBe("Bearer ok");
  });

  test("api=true refreshes when token is missing", () => {
    const c = new HttpClient();
    c.oauth2Token = null;

    const resp = c.request("GET", "/me", { api: true });

    expect(resp.headers.Authorization).toBe("Bearer fresh-token");
  });

  test("api=true refreshes when token is a plain object", () => {
    // This is the key failing case.
    const c = new HttpClient();
    c.oauth2Token = { accessToken: "stale", expiresAt: 0 };

    const resp = c.request("GET", "/me", { api: true });

    expect(resp.headers.Authorization).toBe("Bearer fresh-token");
  });

  test("api=true refreshes when token is an expired OAuth2Token", () => {
    const c = new HttpClient();
    // expiresAt = 0 means it expired at unix epoch (long ago)
    c.oauth2Token = new OAuth2Token("expired-tok", 0);

    const resp = c.request("GET", "/me", { api: true });

    expect(resp.headers.Authorization).toBe("Bearer fresh-token");
  });

  test("api=false does not set Authorization header even with a valid token", () => {
    const c = new HttpClient();
    c.oauth2Token = new OAuth2Token("ok", Math.floor(Date.now() / 1000) + 3600);

    const resp = c.request("GET", "/public", { api: false });

    expect(resp.headers.Authorization).toBeUndefined();
  });
});