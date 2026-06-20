/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev only: proxy METAR to the FAA AWC (which lacks CORS). In production the
    // same data is served by the Vercel serverless function at /api/metar.
    proxy: {
      "/awc": {
        target: "https://aviationweather.gov",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/awc/, ""),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
