/** @type {import('next').NextConfig} */
// cache-bust: v101
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
      // Cloudinary CDN for listing images
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    dangerouslyAllowSVG: false,
    // base64 data URIs are rendered via plain <img> tags in components,
    // so Next.js optimization never touches them — no quality loss.
    unoptimized: false,
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    // Disable module concatenation to prevent Leaflet chunk caching issues
    config.optimization = { ...config.optimization, moduleIds: 'named' };
    return config;
  },
};

export default nextConfig;
