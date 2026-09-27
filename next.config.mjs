const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy (issue #116). It blocks, not report-only.
 *
 * - Supabase: REST, Auth, Storage, Edge Functions (https) and Realtime (wss).
 * - PayMongo: the browser creates the GCash / Maya payment method itself
 *   (`lib/checkout/paymongo.ts`). The wallet page is a navigation, which CSP
 *   does not restrict.
 * - vercel.live: the comment toolbar Vercel injects into preview deploys.
 * - 'unsafe-inline' scripts: Next.js 14 inlines its bootstrap scripts, and
 *   nonces would force every page to render dynamically.
 * - 'unsafe-eval' only in dev, for React Fast Refresh.
 */
function contentSecurityPolicy({ extraScript = "", extraStyle = "" } = {}) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://vercel.live ${extraScript}`,
    `style-src 'self' 'unsafe-inline' ${extraStyle}`,
    "img-src 'self' data: blob: https://*.supabase.co https://vercel.live https://vercel.com https://images.unsplash.com",
    "font-src 'self' data: https://vercel.live",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paymongo.com https://vercel.live wss://ws-us3.pusher.com",
    "frame-src https://vercel.live",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
    .map((directive) => directive.trim())
    .join("; ");
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Update this once the Supabase project is created —
        // used for menu item images stored in Supabase Storage.
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Swagger UI loads its bundle and stylesheet from jsDelivr. Allowed on
      // this page only; the later entry overrides the CSP set above.
      {
        source: "/api-docs",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy({
              extraScript: "https://cdn.jsdelivr.net",
              extraStyle: "https://cdn.jsdelivr.net",
            }),
          },
        ],
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.infrastructureLogging = {
        level: "error",
      };
    }
    return config;
  },
};

export default nextConfig;
