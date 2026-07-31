# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# BUILD-TIME configuration. Both values are consumed by `next build` and frozen into
# the image — neither is read at runtime, so setting them as Cloud Run env vars has
# no effect:
#   NEXT_PUBLIC_API_URL  is inlined into the client bundle, and next.config.mjs also
#                        derives the CSP connect-src allow-list from it.
#   API_PROXY_TARGET     is read inside rewrites(), which Next evaluates during the
#                        build and serializes into .next/routes-manifest.json.
# Changing either one requires rebuilding the image. See cloudbuild.yaml.
ARG NEXT_PUBLIC_API_URL=/api
ARG API_PROXY_TARGET
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_PROXY_TARGET=$API_PROXY_TARGET

# A deployed image always serves /api itself, so an empty API_PROXY_TARGET is always
# a mistake HERE — even though next.config.mjs tolerates it for `next dev`, the CI
# e2e build, and the nginx topology. Without this the build succeeds and produces a
# healthy-looking image whose every API call 404s at runtime.
RUN test -n "$API_PROXY_TARGET" || { \
      echo "ERROR: API_PROXY_TARGET build arg is required to build a deployable image."; \
      echo "       Pass it with --build-arg (CI does this via cloudbuild.yaml)."; \
      exit 1; \
    }

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Trust, but verify. The check above proves the variable was present; this proves it
# actually took effect. Catches the case where the value is set but the rewrite is
# dropped or misdirected by a config regression — which no runtime test would notice
# until the site was already live.
RUN node -e "\
const m = require('./.next/routes-manifest.json'); \
const rw = m.rewrites; \
const all = Array.isArray(rw) ? rw : [...(rw.beforeFiles||[]), ...(rw.afterFiles||[]), ...(rw.fallback||[])]; \
const hit = all.find(r => r.source === '/api/:path*'); \
const want = process.env.API_PROXY_TARGET.replace(/\/\$/, ''); \
if (!hit) { console.error('ERROR: no /api/:path* rewrite in routes-manifest.json'); process.exit(1); } \
if (!hit.destination.startsWith(want)) { \
  console.error('ERROR: /api rewrite points at ' + hit.destination + ', expected ' + want); \
  process.exit(1); \
} \
console.log('verified /api rewrite -> ' + hit.destination);"

# ---- runner ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run injects PORT (defaults to 8080). Next's standalone server reads PORT/HOSTNAME.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next standalone output: minimal server + only the deps it actually uses.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# WeChat Mini-Program 业务域名 (business domain) verification file — WeChat fetches
# https://<domain>/<file> and compares the body to the token before it will accept
# the domain for web-view. Written HERE rather than committed to public/ so the
# value is a GitHub variable, not a source change. See "CI/CD" in README.md.
#
# Three things make this work, none of them obvious:
#   1. Writing it AFTER `next build` is fine. Next's standalone server scans
#      ./public when the process BOOTS, not at build time — setupFsCheck() ->
#      recursiveReadDir(public) in next/dist/server/lib/router-utils/filesystem.js.
#      (Which also means it must be on disk before `node server.js` starts; adding
#      it to a live container would not be picked up.)
#   2. next-intl leaves it alone. src/proxy.ts's matcher already excludes paths
#      containing a dot, so /<file>.txt is never redirected to /zh-CN/<file>.txt.
#   3. This runs before `USER nextjs`, so root can write into the root-owned
#      public/ dir; the file lands world-readable.
#
# Optional — an image with no verification file is still a valid image, and local
# `docker build` should not need WeChat values. But HALF a pair is always a
# mistake: it would build clean and the only symptom would be WeChat refusing the
# domain days later, so that fails loudly.
ARG WECHAT_VERIFY_FILE=""
ARG WECHAT_VERIFY_TOKEN=""
RUN if [ -n "$WECHAT_VERIFY_FILE" ] || [ -n "$WECHAT_VERIFY_TOKEN" ]; then \
      { [ -n "$WECHAT_VERIFY_FILE" ] && [ -n "$WECHAT_VERIFY_TOKEN" ]; } || { \
        echo "ERROR: set WECHAT_VERIFY_FILE and WECHAT_VERIFY_TOKEN together, or neither."; \
        exit 1; }; \
      case "$WECHAT_VERIFY_FILE" in \
        .*|*[!A-Za-z0-9._-]*) \
          echo "ERROR: WECHAT_VERIFY_FILE must be a bare filename (no slashes, no leading dot)."; \
          echo "       Got: '$WECHAT_VERIFY_FILE'"; \
          exit 1 ;; \
      esac; \
      printf '%s' "$WECHAT_VERIFY_TOKEN" > "public/$WECHAT_VERIFY_FILE"; \
      echo "baked public/$WECHAT_VERIFY_FILE ($(wc -c < "public/$WECHAT_VERIFY_FILE") bytes, no trailing newline)"; \
    else \
      echo "no WeChat verification file baked into this image"; \
    fi

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
