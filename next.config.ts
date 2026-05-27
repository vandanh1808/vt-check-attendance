import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.2.174",
    "172.16.0.2",
  ],
};

export default nextConfig;
