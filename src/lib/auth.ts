/**
 * Auth bridge for the embedded site.
 *
 * Hand-off path (a one-time code, NOT the raw token):
 *   1. The Mini Program authorizes a short-lived code on our API
 *        PUT /loginCode/auth { code }        ← mints a JWT for the signed-in user
 *   2. It opens the web-view at  https://your-domain/zh-CN?code=ONE_TIME_CODE
 *   3. We read the code and trade it for the JWT
 *        POST /loginCode/exchange { code }   → { data: { token } }
 *      then store the JWT in a first-party COOKIE and strip the code from the URL.
 *
 * Why a code and not the token itself: the URL is the web-view's only inbound
 * channel, but it leaks — into history, the H5 server's access logs, and the
 * `Referer` of the first outbound request. The code is single-use and short-lived
 * server-side (see api/src/handler/login_code_handler.rs `exchange`), so a leaked
 * code is worthless once redeemed, and the real JWT only ever travels in the POST
 * response body.
 *
 * Why a cookie we read in JS (not HttpOnly): the JWT is attached to API calls as an
 * `Authorization: Bearer` header (see lib/api.ts), which works even when the API is
 * on a different origin where the web-view blocks cross-site cookies.
 *
 * Note: the cookie can be cleared between web-view sessions, so the `?code=` URL is
 * the source of truth each time the Mini Program opens the web-view. If exchange
 * fails (used/expired code, network), the app stays unauthenticated — the user
 * re-opens the web-view from the Mini Program to get a fresh code.
 */

import { jwtDecode } from "jwt-decode";

import { getCookie, removeCookie, setCookie } from "@/lib/cookies";
import { env } from "@/lib/env";

const COOKIE_NAME = "wv_token";
const CODE_QUERY_PARAM = "code";
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const EXCHANGE_TIMEOUT_MS = 20_000;

export function getToken(): string | null {
  return getCookie(COOKIE_NAME);
}

export function setToken(token: string): void {
  setCookie(COOKIE_NAME, token, { maxAgeSeconds: cookieMaxAgeFor(token) });
}

export function clearToken(): void {
  removeCookie(COOKIE_NAME);
}

/** Expire the cookie when the JWT expires; fall back to a fixed window. */
function cookieMaxAgeFor(token: string): number {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (exp) {
      const secondsLeft = exp - Math.floor(Date.now() / 1000);
      if (secondsLeft > 0) return secondsLeft;
    }
  } catch {
    // Not a JWT / no exp claim — use the default window.
  }
  return DEFAULT_MAX_AGE;
}

/**
 * POST the one-time code to the API and return the JWT it was exchanged for.
 * Uses bare `fetch` (not the shared axios instance) so this unauthenticated
 * bootstrap call carries no stale `Authorization` header and `lib/auth` stays free
 * of an import cycle with `lib/api`. Throws on a non-2xx response or timeout.
 */
async function exchangeCode(code: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXCHANGE_TIMEOUT_MS);
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/loginCode/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Login code exchange failed: ${res.status}`);
    }
    const json = (await res.json()) as { data?: { token?: string } };
    const token = json.data?.token;
    if (!token) {
      throw new Error("Login code exchange returned no token");
    }
    return token;
  } finally {
    clearTimeout(timer);
  }
}

let inflight: Promise<string | null> | null = null;

/**
 * Establish the session from the current URL. If a `?code=` is present, trade it
 * for a JWT, store it in the cookie, and strip the param from the address bar;
 * otherwise fall back to any existing cookie. Resolves to the active token (or
 * null). Rejects ONLY when a code was present but could not be exchanged, so the
 * caller can tell "no hand-off" apart from "hand-off failed".
 *
 * Concurrent calls (e.g. React StrictMode's double-mount) share one in-flight
 * exchange, so the single-use code is never spent twice.
 */
export function exchangeCodeFromUrl(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!inflight) {
    inflight = runExchangeFromUrl().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function runExchangeFromUrl(): Promise<string | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get(CODE_QUERY_PARAM);
  if (!code) {
    // No hand-off in progress — keep whatever session we already have.
    return getToken();
  }

  // Strip the one-time code from the address bar up front, before the network
  // round-trip, so it never lingers in history and a reload can't replay it (it's
  // single-use server-side regardless).
  url.searchParams.delete(CODE_QUERY_PARAM);
  window.history.replaceState({}, "", url.toString());

  const token = await exchangeCode(code);
  setToken(token);
  return token;
}
