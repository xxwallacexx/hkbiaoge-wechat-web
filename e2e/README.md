# E2E tests

Playwright smoke tests for the embed + plans flows — the auth guard / redirect, the
`?code=`→token exchange, and the products list (tabs, search, the company filter,
infinite scroll). The API is mocked via `page.route` and authed pages set a `wv_token`
cookie, so no backend is needed.

```bash
npx playwright install chromium      # one-time
npm run build && npm run test:e2e
```

A failed run writes the report + traces under `test-results/` / `playwright-report/`
(both gitignored). CI runs `test:e2e` on every PR — see `.github/workflows/e2e.yml`.
