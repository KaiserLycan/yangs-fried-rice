"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

declare global {
  interface Window {
    SwaggerUIBundle?: any;
    SwaggerUIStandalonePreset?: any;
  }
}

export default function ApiDocsPage() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Inject CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css";
    document.head.appendChild(link);

    // Inject SwaggerUIBundle script
    const scriptBundle = document.createElement("script");
    scriptBundle.src =
      "https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js";
    scriptBundle.async = true;

    // Inject Standalone Preset script
    const scriptPreset = document.createElement("script");
    scriptPreset.src =
      "https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js";
    scriptPreset.async = true;

    let bundleLoaded = false;
    let presetLoaded = false;

    function tryInitSwagger() {
      if (
        bundleLoaded &&
        presetLoaded &&
        window.SwaggerUIBundle &&
        window.SwaggerUIStandalonePreset
      ) {
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
        setLoaded(true);
      }
    }

    scriptBundle.onload = () => {
      bundleLoaded = true;
      tryInitSwagger();
    };

    scriptPreset.onload = () => {
      presetLoaded = true;
      tryInitSwagger();
    };

    document.body.appendChild(scriptBundle);
    document.body.appendChild(scriptPreset);

    return () => {
      link.remove();
      scriptBundle.remove();
      scriptPreset.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
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
        {!loaded && (
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
