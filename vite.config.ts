import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { astryxStylex } from "@astryxdesign/build/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// rolldown 对 css exports 的 types 条件解析有误，直接指向 dist 实际文件（vite-plus 0.2.4 仍未修复）
const cssAlias = (spec: string) =>
  fileURLToPath(new URL(`./node_modules/${spec}`, import.meta.url));

// GitHub Pages 项目页部署在 /<repo>/ 子路径下，本地开发和 preview 仍用根路径
// VITE_ 前缀会被 Vite 透传给客户端 import.meta.env，main.tsx 用它判断要不要在生产构建里也开 mock（demo 没有真实后端）
const base = process.env.VITE_GITHUB_PAGES ? "/astryx-admin/" : "/";

// 新增 feature 目录时同步维护这份清单（oxlint 的 `*` 会匹配 `..` 段，不能写成 ../*/**）
const FEATURES = ["apps", "auth", "dashboard", "settings", "tasks", "users"];

// 分层边界（vp lint 读取，oxlint 配置格式）：
//  1. features 之间禁止 import 内部文件，只能走对方 barrel 或共享层
//  2. 共享层（lib/components/stores 等）不得反向依赖 features
//  3. routes 是唯一允许组装 features 的层（1+2 共同保证）
// 不标 OxlintConfig 类型：vite-plus 的巨型规则联合类型会让 tsc 6.0.3 崩溃（Debug Failure）
const lint = {
  overrides: [
      {
        files: ["src/features/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  group: FEATURES.map((name) => `../${name}/**`),
                  message:
                    "feature 之间禁止 import 内部文件：走对方 feature 的 barrel（如 ../users），或把共用逻辑提升到 src/components、src/lib",
                },
              ],
            },
          ],
        },
      },
      {
        files: [
          "src/app/**",
          "src/components/**",
          "src/i18n/**",
          "src/lib/**",
          "src/mocks/**",
          "src/stores/**",
          "src/test/**",
          "src/theme/**",
        ],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  group: ["../features/**", "../../features/**", "../../../features/**"],
                  message: "共享层不能反向依赖 features；features 只允许被 routes 组装",
                },
              ],
            },
          ],
        },
      },
  ],
};

// 中间变量绕过对象字面量的多余属性检查：vitest 的 UserConfig 类型不认识 lint 键，
// 但 vp lint 运行时读取的是导出的配置对象本身
const config = {
  base,
  lint,
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
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
};

export default defineConfig(config);
