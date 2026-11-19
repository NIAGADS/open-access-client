import path from "node:path";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const cacheDirectory = process.env.CACHE_DIR || "/tmp/next-cache";

if (!path.isAbsolute(cacheDirectory)) {
    throw new Error("CACHE_DIR must be an absolute path");
}

const withMDX = createMDX({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [["remark-toc", { heading: "On this page", maxDepth: 3 }]],
        rehypePlugins: ["rehype-slug"],
    },
});

const nextConfig: NextConfig = { pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"] };

export default withMDX(nextConfig);
