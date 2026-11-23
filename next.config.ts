import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/sitemap.html",
        destination: "/sitemap",
        permanent: true,
      },
      {
        source: "/sksinfin",
        destination: "/#why-sks-infi",
        permanent: true,
      },
      {
        source: "/sksinfin.php",
        destination: "/#why-sks-infi",
        permanent: true,
      },
      {
        source: "/index.php",
        destination: "/",
        permanent: true,
      },
      {
        source: "/about.php",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/contact.php",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/calculate_sip.php",
        destination: "/calculate_sip",
        permanent: true,
      },
      {
        source: "/partner-with-us.php",
        destination: "/partner-with-us",
        permanent: true,
      },
      {
        source: "/partner_with_us.php",
        destination: "/partner-with-us",
        permanent: true,
      },
      {
        source: "/enquirynow",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/enquirynow.php",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/apply-now",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/apply-now.php",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/admin/:path*.php",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/:slug.php",
        destination: "/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
