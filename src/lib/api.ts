import axios from "axios";

import { clearToken, getToken } from "@/lib/auth";
import { env } from "@/lib/env";

/**
 * Shared axios instance.
 *
 * `NEXT_PUBLIC_API_URL` should point at the HKBiaoge Rust API. Default `/api` lets
 * the mainland nginx reverse-proxy forward `/api/*` over the same accelerated
 * cross-border link (see nginx.conf), so data calls don't take an un-tuned path.
 */
export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      // Token missing/expired. The Mini Program (via the web-view URL) is the
      // source of the token and there is no in-app login, so we just clear it and
      // let the caller surface the error — the user re-opens the web-view to get
      // a fresh token.
      clearToken();
    }
    return Promise.reject(error);
  },
);
