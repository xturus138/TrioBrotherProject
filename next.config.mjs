/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static", "ffprobe-static"],
  experimental: {
    outputFileTracingIncludes: {
      "app/api/upload/route.ts": [
        "./node_modules/ffmpeg-static/**/*",
        "./node_modules/ffprobe-static/bin/**",
      ],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "fluent-ffmpeg",
        "ffmpeg-static",
        "ffprobe-static",
      ];
    }
    return config;
  },
};

export default nextConfig;
