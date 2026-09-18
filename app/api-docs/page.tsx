"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import Link from "next/link";

declare global {
  interface Window {
    SwaggerUIBundle?: any;
    SwaggerUIStandalonePreset?: any;
  }
}

export default function ApiDocsPage() {
  const [bundleLoaded, setBundleLoaded] = useState(false);
  const [presetLoaded, setPresetLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initSwagger = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.SwaggerUIBundle &&
      window.SwaggerUIStandalonePreset
    ) {
      try {
        window.SwaggerUIBundle({
          url: "/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          filter: true,
          docExpansion: "list",
          displayRequestDuration: true,
          defaultModelsExpandDepth: 0,
          defaultModelExpandDepth: 1,
          tryItOutEnabled: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset,
          ],
          layout: "BaseLayout",
        });
        setInitialized(true);
      } catch (err: any) {
        console.error("Failed to initialize Swagger UI:", err);
        setError(err?.message || "Failed to initialize Swagger UI");
      }
    }
  }, []);

  useEffect(() => {
    if (window.SwaggerUIBundle && window.SwaggerUIStandalonePreset) {
      initSwagger();
    } else if (bundleLoaded && presetLoaded) {
      initSwagger();
    }
  }, [bundleLoaded, presetLoaded, initSwagger]);

  return (
    <div className="min-h-screen bg-[#FBF6EC] text-[#1A1210]">
      {/* Swagger UI Stylesheet */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css"
      />

      {/* Embedded Custom Theme Styles for Swagger UI */}
      <style jsx global>{`
        /* Global typography & layout */
        .swagger-ui {
          font-family: inherit;
          color: #1A1210;
        }

        /* Information container */
        .swagger-ui .info {
          margin: 1.5rem 0 2rem 0;
        }
        .swagger-ui .info .title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #8C1C13;
          letter-spacing: -0.025em;
        }
        .swagger-ui .info h1,
        .swagger-ui .info h2,
        .swagger-ui .info h3 {
          color: #8C1C13;
          font-weight: 700;
          margin-top: 1.25rem;
        }
        .swagger-ui .info table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.875rem;
          background: #ffffff;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .swagger-ui .info table th {
          background-color: #F5EBE1;
          color: #8C1C13;
          font-weight: 600;
          text-align: left;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #E7D7C1;
        }
        .swagger-ui .info table td {
          padding: 0.65rem 1rem;
          border-bottom: 1px solid #F0E6D8;
          color: #332B29;
          vertical-align: top;
        }
        .swagger-ui .info table tr:last-child td {
          border-bottom: none;
        }

        /* Filter input bar */
        .swagger-ui .filter-container {
          margin: 1.5rem 0;
          padding: 0;
        }
        .swagger-ui .filter input {
          width: 100% !important;
          border-radius: 0.5rem !important;
          border: 1.5px solid #E7D7C1 !important;
          padding: 0.65rem 1rem !important;
          font-size: 0.875rem !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.2s ease;
        }
        .swagger-ui .filter input:focus {
          border-color: #8C1C13 !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(140, 28, 19, 0.15) !important;
        }

        /* Tag headers (11 modules) */
        .swagger-ui .opblock-tag-section {
          margin-bottom: 1.25rem;
        }
        .swagger-ui .opblock-tag {
          font-size: 1.25rem;
          font-weight: 700;
          color: #8C1C13;
          border-bottom: 2px solid #E7D7C1;
          padding: 0.75rem 0;
          margin-bottom: 0.75rem;
          transition: color 0.15s ease;
        }
        .swagger-ui .opblock-tag:hover {
          color: #A8382E;
        }
        .swagger-ui .opblock-tag small {
          color: #7A6A60;
          font-size: 0.8125rem;
          font-weight: 400;
          margin-left: 0.5rem;
        }

        /* Opblock cards */
        .swagger-ui .opblock {
          border-radius: 0.5rem !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
          margin: 0 0 0.75rem 0 !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          overflow: hidden;
        }
        .swagger-ui .opblock .opblock-summary {
          padding: 0.625rem 1rem !important;
        }
        .swagger-ui .opblock .opblock-summary-method {
          border-radius: 0.375rem !important;
          font-weight: 700 !important;
          font-size: 0.75rem !important;
          min-width: 70px !important;
          text-align: center !important;
          padding: 0.35rem 0.6rem !important;
        }
        .swagger-ui .opblock-summary-path {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          color: #1A1210 !important;
        }
        .swagger-ui .opblock-summary-description {
          font-size: 0.8125rem !important;
          color: #665851 !important;
        }

        /* Buttons */
        .swagger-ui .btn.execute {
          background-color: #8C1C13 !important;
          border-color: #8C1C13 !important;
          color: #ffffff !important;
          border-radius: 0.375rem !important;
          font-weight: 600 !important;
          transition: background-color 0.15s ease;
        }
        .swagger-ui .btn.execute:hover {
          background-color: #A8382E !important;
        }
        .swagger-ui .btn.try-out__btn {
          border-radius: 0.375rem !important;
          border-color: #8C1C13 !important;
          color: #8C1C13 !important;
        }
        .swagger-ui .btn.try-out__btn:hover {
          background-color: rgba(140, 28, 19, 0.08) !important;
        }

        /* Topbar elimination if loaded */
        .swagger-ui .topbar {
          display: none !important;
        }
      `}</style>

      {/* Load Swagger UI Bundle & Standalone Preset */}
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          setBundleLoaded(true);
        }}
        onError={() => {
          setError("Failed to download Swagger UI bundle. Please check your network connection.");
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
        onLoad={() => {
          setPresetLoaded(true);
        }}
        onError={() => {
          setError("Failed to download Swagger UI standalone preset.");
        }}
      />

      {/* Brand Header */}
      <header className="sticky top-0 z-30 border-b border-[#A8382E] bg-[#8C1C13] px-6 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAF5EE] text-[#8C1C13] font-black text-lg shadow-sm">
                楊
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#FAF5EE]">
                  Yang&apos;s Fried Rice
                </h1>
                <p className="text-[11px] font-medium tracking-wide uppercase text-[#E7C4BE]">
                  REST API Interactive Documentation
                </p>
              </div>
            </Link>
            <span className="hidden sm:inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-[#FAF5EE]">
              OpenAPI 3.0.3
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/"
              className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/20 transition-all"
            >
              Back to Store
            </Link>
            <a
              href="/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-white/20 bg-white/15 px-3 py-1.5 font-mono text-white hover:bg-white/25 transition-all shadow-sm"
            >
              Raw openapi.json
            </a>
          </div>
        </div>
      </header>

      {/* Metrics Summary Strip */}
      <div className="border-b border-[#E7D7C1] bg-[#F5EBE1]/70 px-6 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-[#7A6A60]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-[#1A1210]">Live Development API</strong>
            </span>
            <span>•</span>
            <span><strong>71</strong> Endpoints</span>
            <span>•</span>
            <span><strong>11</strong> Core Modules</span>
            <span>•</span>
            <span><strong>3</strong> External Geospatial Services</span>
          </div>
          <div className="text-[11px] text-[#7A6A60]">
            Interactive testing enabled via <em>&quot;Try it out&quot;</em>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="my-8 rounded-lg border border-red-300 bg-red-50 p-5 text-red-800 shadow-sm">
            <h2 className="font-semibold text-base">Unable to load API Documentation</h2>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {!initialized && !error && (
          <div className="flex flex-col items-center justify-center py-28 text-gray-500 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#8C1C13]" />
            <p className="font-medium text-sm text-[#7A6A60]">
              Loading Swagger UI interactive console...
            </p>
          </div>
        )}

        <div id="swagger-ui" className="bg-white rounded-xl p-4 sm:p-8 shadow-sm border border-[#E7D7C1]" />
      </main>
    </div>
  );
}


