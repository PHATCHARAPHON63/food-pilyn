import type { NextConfig } from "next";

const mapsKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: mapsKey,
    NEXT_PUBLIC_STORE_LAT: process.env.NEXT_PUBLIC_STORE_LAT || process.env.STORE_LAT || '13.7563',
    NEXT_PUBLIC_STORE_LNG: process.env.NEXT_PUBLIC_STORE_LNG || process.env.STORE_LNG || '100.5018',
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
