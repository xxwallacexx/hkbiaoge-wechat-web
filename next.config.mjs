import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Allow the API origin in connect-src when it's a full URL (e.g. Cloud Run).
// When NEXT_PUBLIC_API_URL is "/api" (same-origin via nginx), this stays empty.
const apiOrigin = (() => {
  const u = process.env.NEXT_PUBLIC_API_URL;
  try {
    if (u && /^https?:\/\//.test(u)) return new URL(u).origin;
  } catch {
    // ignore malformed values
  }
  return "";
})();

const csp = [
  "default-src 'self'",
  // 'unsafe-inline'/'unsafe-eval' are needed without a nonce setup — tighten later.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://res.wx.qq.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.oss-cn-hongkong.aliyuncs.com",
  `connect-src 'self' https://res.wx.qq.com${apiOrigin ? ` ${apiOrigin}` : ""}`,
  "font-src 'self' data:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image (Cloud Run).
  output: "standalone",
  poweredByHeader: false,
  images: {
    // HKBiaoge assets live on Alibaba OSS (Hong Kong region).
    remotePatterns: [
      { protocol: "https", hostname: "*.oss-cn-hongkong.aliyuncs.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Proxy /api/* to the real API so the browser calls it same-origin — no CORS and
  // no OPTIONS preflight. API_PROXY_TARGET is server-side only (never exposed to the
  // browser). Leave it unset where a separate proxy (e.g. nginx) already forwards
  // /api/*; then no rewrite is added.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${target.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
