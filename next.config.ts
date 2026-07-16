import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yqcmrbpswshhoixxgvmy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // 💡 TAMBAHKAN BLOK INI UNTUK MELONGGARKAN BATAS UPLOAD BASE64
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', 
    },
  },
};

export default nextConfig;