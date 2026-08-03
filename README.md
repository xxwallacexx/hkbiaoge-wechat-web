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
- **PDF hand-off:** a `<web-view>` can't call `wx.openDocument`, so tapping a PDF
  (產品單頁 / 優惠推廣) navigates to a **native page the client owns** —
  `/pages/pdf/index?url=...&name=...`, each param `encodeURIComponent`-encoded once.
  They must also add the OSS host to their **downloadFile 合法域名** list. The full
  spec, with a copy-pasteable page, is in
  [`docs/mini-program-pdf-page.md`](docs/mini-program-pdf-page.md); the route lives in
  one constant (`PDF_VIEWER_PAGE`, `src/lib/pdf-viewer.ts`).

## Production baseline (included)

- **Resilience:** `error.tsx`, `loading.tsx`, `not-found.tsx`, `global-error.tsx`
- **Auth:** cookie-based token bridge (token from the web-view URL); 401 clears the token
- **Config safety:** zod-validated env (`src/lib/env.ts`)
- **Security headers + CSP** (`next.config.mjs`); `X-Powered-By` disabled
- **Error reporting:** `src/lib/report-error.ts` (+ global handlers) — POSTs to
  `NEXT_PUBLIC_ERROR_REPORT_URL` when set; swap in Sentry later
- **Health probe:** `GET /healthcheck` → `{"status":"ok"}` (for Cloud Run).
  Not `/healthz` — Google Frontend intercepts that exact path on `*.run.app`
  and returns its own 404 before the request reaches the container.
- **Tests:** Vitest unit tests (auth bridge) + Playwright smoke (`e2e/`)

Still to do for real launch: replace the demo home page, and (optionally) move to
HttpOnly cookies once `/api` is served same-origin via the nginx proxy.

## Deploy (ECS nginx → Cloud Run, per the project plan)

- Build the image (`Dockerfile`) → **Cloud Run `asia-east2` (Hong Kong)**; point
  the health check at `/healthcheck`.
- **HK/overseas** users → geo-DNS resolves straight to Cloud Run.
- **Mainland** users → **Aliyun mainland ECS nginx** (`nginx.conf`): caches
  aggressively, serves stale on cross-border blips, and proxies `/api` over the
  same accelerated link.
- ICP 备案 the domain (mainland audience), HTTPS, host the verify `.txt` at root.

### CI/CD

Merges to `main` build on Cloud Build and deploy to Cloud Run via the `deploy` job
in `.github/workflows/ci.yml`. Auth is keyless (Workload Identity Federation).

Nothing environment-specific is committed. All config comes from GitHub, under
_Settings → Secrets and variables → Actions_:

| Kind         | Name                                                                               | Why                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Variable** | `GCP_PROJECT`, `GCP_REGION`, `CR_SERVICE`, `AR_IMAGE`, `WIF_PROVIDER`, `DEPLOY_SA` | Identifiers, not credentials. As secrets they would be redacted from your own build logs while hiding nothing from anyone else — gcloud prints them constantly. |
| **Variable** | `NEXT_PUBLIC_API_URL`                                                              | `/api` — same-origin, so no CORS preflight.                                                                                                                     |
| **Variable** | `WECHAT_VERIFY_FILE`, `WECHAT_VERIFY_TOKEN`                                        | Mini-Program 业务域名 verification — see below. Optional, but set them together. Deliberately not secrets: WeChat requires the value to be world-readable.      |
| **Secret**   | `API_PROXY_TARGET`                                                                 | The API upstream. Not a credential (it answers `401` unauthenticated), but this repo is public, so a secret keeps it out of world-readable build logs.          |

`cloudbuild.yaml` declares those substitutions with empty defaults and fails fast in
a `validate` step if CI does not supply them — an empty `_API_PROXY_TARGET` would
otherwise build a working-looking image whose `/api` calls all 404.

Four things about this setup are load-bearing and easy to break by accident:

- **`NEXT_PUBLIC_API_URL` and `API_PROXY_TARGET` are build-time only.** Next inlines
  the first into the client bundle and freezes the second into
  `.next/routes-manifest.json` during `next build`. Setting either as a Cloud Run
  env var does nothing — changing them means rebuilding the image.
- **The WIF binding only trusts `refs/heads/main`.** Branch protection on `main` is
  therefore part of the security boundary, not just hygiene. Deploys from any other
  branch cannot authenticate, which is intentional.
- **Never add `deploy` to the required status checks.** It is gated on `push`, so it
  never reports on a pull request; requiring it would leave `main` permanently
  unmergeable. Require only `lint`, `unit` and `e2e`.
- **`deploy` also accepts `workflow_dispatch` on `main`.** That is what makes a
  variable-only change deployable without a commit — the rotation path for
  `WECHAT_VERIFY_TOKEN`. The ref is still pinned to `main`, so this widens how a
  deploy is triggered, not what can be deployed.

### WeChat business-domain (业务域名) verification file

WeChat will only whitelist a domain for `web-view` after fetching a file from its
root and matching the body exactly. The Mini Program console issues both the
filename and the token; put them in the two repository variables above and the
Dockerfile writes `public/$WECHAT_VERIFY_FILE` into the image.

It lives in the image rather than in `public/` in git so the token can be rotated
from GitHub. To rotate: edit the variable, then _Actions → CI → Run workflow_ on
`main`. The deploy job's smoke test refetches the URL and fails the deploy if the
body does not match, so a typo cannot ship silently.

Two non-obvious things make this work, and both are easy to undo:

- The file is written in the **runner** stage, after `next build`. That is safe
  because Next's standalone server scans `public/` when the process **boots**, not
  at build time (`setupFsCheck()` → `recursiveReadDir(public)`). It also means the
  file must be in the image — dropping it onto a running container does nothing.
- `src/proxy.ts`'s matcher excludes paths containing a dot, so next-intl never
  redirects `/<file>.txt` to `/zh-CN/<file>.txt`. Narrowing that matcher would
  break domain verification with no other visible symptom.

Note that `nginx.conf`'s catch-all `location /` already proxies the file through to
Cloud Run, so the mainland ECS box needs no second copy.

## Production checklist (WeChat)

- [ ] Client's Mini Program is a **verified company** account (个人 and 海外 accounts
      cannot use `web-view` at all)
- [ ] Domain **ICP 备案** complete — required for 业务域名, and a Cloud Run
      `*.run.app` URL cannot be filed, so this needs the real domain
- [ ] Domain mapped to the Cloud Run service, then added to the Mini Program
      **业务域名 whitelist**
- [ ] OSS host on the Mini Program's **downloadFile 合法域名** list, and their PDF page
      built + its real route confirmed against `PDF_VIEWER_PAGE` — until then, tapping
      a brochure or promotion does nothing inside WeChat
      (see [`docs/mini-program-pdf-page.md`](docs/mini-program-pdf-page.md))
- [ ] `WECHAT_VERIFY_FILE` / `WECHAT_VERIFY_TOKEN` set, and the deploy smoke test
      green — verify by hand with `curl https://YOUR-DOMAIN/$WECHAT_VERIFY_FILE`
- [ ] Tested on iOS WeChat **and** low-end Android WeChat (X5) — especially the Dialog
