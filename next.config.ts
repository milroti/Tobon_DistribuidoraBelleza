import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kzpqsgszrdcgsksckdvq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  webpack(config) {
    const addTailwindLoader = (rules: any[]) => {
      for (const rule of rules) {
        if (Array.isArray(rule.oneOf)) {
          addTailwindLoader(rule.oneOf);
        }
        if (Array.isArray(rule.use)) {
          const hasCssLoader = rule.use.some(
            (u: any) =>
              typeof u === "object" &&
              typeof u?.loader === "string" &&
              (u.loader.includes("css-loader") ||
                u.loader.includes("postcss-loader"))
          );
          if (hasCssLoader) {
            rule.use.push({
              loader: "@tailwindcss/turbopack",
            });
          }
        }
      }
    };

    if (Array.isArray(config.module?.rules)) {
      addTailwindLoader(config.module.rules);
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
