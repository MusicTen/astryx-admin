import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { astryxStylex } from "@astryxdesign/build/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// rolldown 对 css exports 的 types 条件解析有误，直接指向 dist 实际文件
const cssAlias = (spec: string) =>
  fileURLToPath(new URL(`./node_modules/${spec}`, import.meta.url));

// GitHub Pages 项目页部署在 /<repo>/ 子路径下，本地开发和 preview 仍用根路径
const base = process.env.GITHUB_PAGES ? "/astryx-admin/" : "/";

export default defineConfig({
  base,
  test: {
    environment: "happy-dom",
  },
  resolve: {
    alias: {
      "@astryxdesign/core/astryx.css": cssAlias("@astryxdesign/core/dist/astryx.css"),
      "@astryxdesign/theme-neutral/theme.css": cssAlias(
        "@astryxdesign/theme-neutral/dist/theme.css",
      ),
    },
  },
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), astryxStylex()],
});
