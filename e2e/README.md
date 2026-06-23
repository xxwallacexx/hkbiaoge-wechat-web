# E2E & visual tests

Two kinds of Playwright tests live here, split into separate projects in
`playwright.config.ts`.

## Functional (`*.spec.ts`) — project `functional`

Browser-agnostic assertions (redirects, the code→token exchange, rendered copy),
run on Chromium. Safe to run on any machine.

```bash
npx playwright install chromium      # one-time
npm run build && npm run test:e2e
```

## Visual regression (`*.visual.spec.ts`) — project `visual`

Screenshots of the embed page at **iPhone XR (414×896)** and **iPad Air (820×1180)**,
diffed against committed baselines to catch unintended layout changes.

**Baselines are OS-specific.** Playwright suffixes each snapshot per platform, and
macOS vs Linux render fonts/anti-aliasing differently. So baselines must be generated
AND checked in the **same environment as CI** — the Playwright Docker image (Linux) —
or you'll get false diffs. Do **not** commit macOS-generated baselines.

The image tag must match the installed Playwright version (`@playwright/test`,
currently **1.61.0**).

### Generate / update baselines

Run once to create them, and again whenever the UI changes intentionally. From the
repo root (`wechat-web/`):

```bash
docker run --rm -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.61.0-noble \
  bash -c "npm ci && npm run build && npm run test:visual:update"
```

Then commit the generated `e2e/responsive.visual.spec.ts-snapshots/*.png`.

> `npm ci` runs **inside** the container so the Linux-native binaries (Next's SWC,
> etc.) are correct — don't reuse host `node_modules`.

### Run the check (locally or in CI)

```bash
docker run --rm -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.61.0-noble \
  bash -c "npm ci && npm run build && npm run test:visual"
```

A failed run writes the actual/expected/diff PNGs under `test-results/` (gitignored).

### GitHub Actions

The workflow [`.github/workflows/visual.yml`](../.github/workflows/visual.yml) runs this
on every pull request (the check) and on demand (regenerate baselines), and uploads the
PNGs as a **`visual-screenshots`** artifact either way.

**Bootstrap the Linux baselines (one-time):** Actions → **Visual regression** → **Run
workflow** → tick **update** → Run. Then download the artifact — run page → **Artifacts**,
or `gh run download <run-id> -n visual-screenshots` — and commit the generated
`e2e/responsive.visual.spec.ts-snapshots/*-linux.png` files.

After that, PRs run `test:visual` against the committed Linux baselines. On a failure the
same artifact carries the `*-actual` / `*-expected` / `*-diff` PNGs to inspect.

## Notes

- The `visual` project uses **Chromium** (stable, conventional for visual diffs).
  Switch its browser to WebKit in `playwright.config.ts` if you want
  iOS-Safari-closer rendering — but regenerate the baselines after.
- Real low-end Android **X5** rendering isn't covered by headless engines — use a
  real device or BrowserStack for that.
