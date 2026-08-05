import { afterEach, describe, expect, it, vi } from "vitest";

import { isMiniProgram, isMiniProgramSync, isWeChat } from "@/lib/wechat";

const MP_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 " +
  "Mobile/15E148 MicroMessenger/8.0.44(0x18002c2b) NetType/WIFI Language/zh_CN miniProgram";
const WECHAT_H5_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 " +
  "Mobile/15E148 MicroMessenger/8.0.44(0x18002c2b) NetType/WIFI Language/zh_CN";
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";

function setUa(ua: string) {
  vi.stubGlobal("navigator", { userAgent: ua });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete window.wx;
  delete window.__wxjs_environment;
});

describe("isWeChat", () => {
  it("matches any WeChat in-app browser", () => {
    setUa(WECHAT_H5_UA);
    expect(isWeChat()).toBe(true);
  });

  it("is false in a plain browser", () => {
    setUa(CHROME_UA);
    expect(isWeChat()).toBe(false);
  });
});

describe("isMiniProgramSync", () => {
  it("detects a web-view from the UA alone, with no SDK loaded", () => {
    setUa(MP_UA);
    expect(window.wx).toBeUndefined();
    expect(isMiniProgramSync()).toBe(true);
  });

  it("falls back to __wxjs_environment when the UA lacks the suffix", () => {
    setUa(WECHAT_H5_UA);
    window.__wxjs_environment = "miniprogram";
    expect(isMiniProgramSync()).toBe(true);
  });

  it("is false in the WeChat browser outside a Mini Program", () => {
    setUa(WECHAT_H5_UA);
    expect(isMiniProgramSync()).toBe(false);
  });

  it("is false in a plain browser even if the UA is otherwise odd", () => {
    setUa(CHROME_UA);
    expect(isMiniProgramSync()).toBe(false);
  });
});

describe("isMiniProgram", () => {
  it("resolves true without ever calling getEnv", async () => {
    setUa(MP_UA);
    const getEnv = vi.fn();
    window.wx = { miniProgram: { getEnv } as never };

    await expect(isMiniProgram()).resolves.toBe(true);
    // The regression this guards: getEnv's callback can be dropped by WeChat, so the
    // answer must not depend on it ever coming back.
    expect(getEnv).not.toHaveBeenCalled();
  });

  it("settles instead of hanging when getEnv never calls back", async () => {
    vi.useFakeTimers();
    setUa(WECHAT_H5_UA);
    // A bridge that accepts the call and silently drops it — the production symptom.
    window.wx = { miniProgram: { getEnv: () => {} } as never };

    const pending = isMiniProgram();
    await vi.advanceTimersByTimeAsync(5000);
    await expect(pending).resolves.toBe(false);
    vi.useRealTimers();
  });

  it("is false in a plain browser", async () => {
    setUa(CHROME_UA);
    await expect(isMiniProgram()).resolves.toBe(false);
  });
});
