/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
    ],
    // Allow base64 data URIs for uploaded listing photos
    dangerouslyAllowSVG: false,
    unoptimized: false,
  },
  // Suppress noisy build warnings for Leaflet CDN usage
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;
