import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@langchain/langgraph",
    "@langchain/langgraph-checkpoint",
    "@langchain/core",
    "@langchain/openai",
  ],
};

export default nextConfig;
