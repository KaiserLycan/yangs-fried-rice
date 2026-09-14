"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";

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
    <div className="min-h-screen bg-white">
      {/* Swagger UI Stylesheet */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css"
      />

      {/* Load Swagger UI Bundle & Standalone Preset via Next.js Script */}
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
      <header className="border-b border-[#E7D7C1] bg-[#8C1C13] px-6 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
              OpenAPI 3.0
            </span>
            <h1 className="text-lg font-bold tracking-tight">
              Yang&apos;s Fried Rice — Interactive API Documentation
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a
              href="/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/30 bg-white/10 px-3 py-1.5 font-mono text-white hover:bg-white/20 transition-all"
            >
              Raw openapi.json
            </a>
          </div>
        </div>
      </header>

      {/* Swagger UI Container */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        {error && (
          <div className="my-8 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <h2 className="font-semibold">Unable to load API Documentation</h2>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!initialized && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#8C1C13]" />
            <p className="font-mono text-sm">Loading Swagger UI interactive console...</p>
          </div>
        )}
        <div id="swagger-ui" />
      </main>
    </div>
  );
}

