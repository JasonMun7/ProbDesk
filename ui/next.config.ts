import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@copilotkit/runtime"],
  transpilePackages: ["@copilotkit/react-core", "@copilotkit/react-ui"],
};

export default nextConfig;
