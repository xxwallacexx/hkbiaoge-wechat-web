# wechat-web

A standalone website (Next.js) built to be **embedded into a client-owned WeChat
Mini Program** via the `<web-view>` component. Same house stack as `webview/`
(Tailwind + shadcn/ui + TanStack Query + axios + `next-intl`), on Next 16 (App
Router) + React 19, with locales `zh-CN` / `zh-HK` / `en`.

> **Scope:** this app is **only the website**. The client owns the Mini Program
> (the verified account, the `<web-view>` page, and the 业务域名 whitelist).

## Develop

```bash
npm install
npm run dev          # http://localhost:3000  → redirects to /zh-CN

npm run build        # standalone build for the container
npm run typecheck    # tsc --noEmit
npm test             # vitest unit tests
npm run test:e2e     # playwright (first: npx playwright install chromium)
npm run format       # prettier --write .
```

Locales: `/zh-CN` (default, Simplified), `/zh-HK` (Traditional), `/en`.

## How embedding works

The Mini Program mints a short-lived, single-use **code** on our API
(`PUT /loginCode/auth`) and embeds a URL like:

```html
<web-view src="https://YOUR-DOMAIN/zh-CN?code=ONE_TIME_CODE" />
```

- `?code=` is read on load and traded for the JWT via `POST /loginCode/exchange`
  (`src/lib/auth.ts`); the token is stored in a first-party **cookie** (`wv_token`)
  and the code is stripped from the URL. The JWT is then sent to the API as an
  `Authorization: Bearer` header (`src/lib/api.ts`) — this works cross-origin to
  the API and inside the web-view (which blocks cross-site cookies).
- **Why a code, not the raw token:** the web-view URL leaks (into history, the H5
  server's logs, and the first outbound `Referer`). The code is single-use and
  short-lived server-side, so a leaked code is worthless once redeemed, and the JWT
  only ever travels in the exchange response body.
- The code comes **only** from the Mini Program via the web-view URL — there's no
  in-app login. A used/expired code or a 401 leaves the app unauthenticated; the
  user re-opens the web-view to get a fresh code. No WeChat-native login/pay is
  used, so none of the web-view native-API limits bite.
- `src/lib/wechat.ts` loads `jweixin` and exposes the `wx.miniProgram.*` bridge
  (`navigateBack`, `navigateTo`, `postMessage`, …) — all safe no-ops outside the
  Mini Program, so the same site also works as a plain browser page.

### Contract to agree with the client

- **Embed URL + params:** `/{locale}?code=...&route=...`
- **Verify file:** you serve the WeChat domain-verification `.txt` at the site
  root; the client registers + whitelists the domain.

## Production baseline (included)

- **Resilience:** `error.tsx`, `loading.tsx`, `not-found.tsx`, `global-error.tsx`
- **Auth:** cookie-based token bridge (token from the web-view URL); 401 clears the token
- **Config safety:** zod-validated env (`src/lib/env.ts`)
- **Security headers + CSP** (`next.config.mjs`); `X-Powered-By` disabled
- **Error reporting:** `src/lib/report-error.ts` (+ global handlers) — POSTs to
  `NEXT_PUBLIC_ERROR_REPORT_URL` when set; swap in Sentry later
- **Health probe:** `GET /healthz` → `{"status":"ok"}` (for Cloud Run)
- **Tests:** Vitest unit tests (auth bridge) + Playwright smoke (`e2e/`)

Still to do for real launch: replace the demo home page, and (optionally) move to
HttpOnly cookies once `/api` is served same-origin via the nginx proxy.

## Deploy (ECS nginx → Cloud Run, per the project plan)

- Build the image (`Dockerfile`) → **Cloud Run `asia-east2` (Hong Kong)**; point
  the health check at `/healthz`.
- **HK/overseas** users → geo-DNS resolves straight to Cloud Run.
- **Mainland** users → **Aliyun mainland ECS nginx** (`nginx.conf`): caches
  aggressively, serves stale on cross-border blips, and proxies `/api` over the
  same accelerated link.
- ICP 备案 the domain (mainland audience), HTTPS, host the verify `.txt` at root.

## Production checklist (WeChat)

- [ ] Client's Mini Program is a **verified company** account
- [ ] Domain **ICP 备案** complete (mainland audience)
- [ ] Domain added to the Mini Program **业务域名 whitelist**
- [ ] WeChat verify `.txt` reachable at `https://YOUR-DOMAIN/MP_verify_xxx.txt`
- [ ] Tested on iOS WeChat **and** low-end Android WeChat (X5) — especially the Dialog
