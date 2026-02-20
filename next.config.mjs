/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
    ],
    // Bump quality for any remote images processed by Next.js optimizer
    qualities: [75, 90, 95],
    dangerouslyAllowSVG: false,
    // base64 data URIs are rendered via plain <img> tags in components,
    // so Next.js optimization never touches them — no quality loss.
    unoptimized: false,
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;
