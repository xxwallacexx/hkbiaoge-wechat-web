import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearToken, exchangeCodeFromUrl, getToken } from "@/lib/auth";
import { getCookie, removeCookie, setCookie } from "@/lib/cookies";

beforeEach(() => {
  clearToken();
  removeCookie("foo");
  window.history.replaceState({}, "", "/zh-CN");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cookies", () => {
  it("round-trips a value", () => {
    setCookie("foo", "bar");
    expect(getCookie("foo")).toBe("bar");
  });

  it("removes a value", () => {
    setCookie("foo", "bar");
    removeCookie("foo");
    expect(getCookie("foo")).toBeNull();
  });

  it("encodes special characters", () => {
    setCookie("foo", "a b;c=d");
    expect(getCookie("foo")).toBe("a b;c=d");
  });
});

describe("auth bridge", () => {
  it("exchanges a one-time code for a token, stores it, and strips the param", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { token: "jwt123" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    window.history.replaceState({}, "", "/zh-CN?code=abc&foo=bar");
    const token = await exchangeCodeFromUrl();

    expect(token).toBe("jwt123");
    expect(getToken()).toBe("jwt123");
    expect(window.location.search).not.toContain("code=");
    expect(window.location.search).toContain("foo=bar");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/loginCode/exchange");
    expect(init).toMatchObject({ method: "POST" });
    expect(JSON.parse(init.body as string)).toEqual({ code: "abc" });
  });

  it("falls back to the existing cookie when no code is in the URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setCookie("wv_token", "existing");

    await expect(exchangeCodeFromUrl()).resolves.toBe("existing");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when there is no code and no cookie", async () => {
    await expect(exchangeCodeFromUrl()).resolves.toBeNull();
  });

  it("rejects and strips the param when the exchange fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      }),
    );

    window.history.replaceState({}, "", "/zh-CN?code=dead");
    await expect(exchangeCodeFromUrl()).rejects.toThrow();
    expect(getToken()).toBeNull();
    expect(window.location.search).not.toContain("code=");
  });
});
