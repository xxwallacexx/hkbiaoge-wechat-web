"use client";

import { useEffect, useState } from "react";

import { exchangeCodeFromUrl } from "@/lib/auth";

/**
 * On mount, establishes the session from the web-view URL: trades a one-time
 * `?code=` for a JWT (stored in a cookie) and reports auth state. `ready` stays
 * false until the (async, client-only) exchange settles, so the UI can avoid
 * flashing the wrong state during hydration. `error` is true when a code was
 * present but could not be exchanged (used / expired / network).
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function establishSession() {
      try {
        const value = await exchangeCodeFromUrl();
        if (active) setToken(value);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setReady(true);
      }
    }

    void establishSession();

    return () => {
      active = false;
    };
  }, []);

  return { token, ready, error, isAuthenticated: Boolean(token) };
}
