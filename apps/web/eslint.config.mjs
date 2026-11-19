import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { createRequire } from "node:module";

// 플러그인 4.3.2의 ESM 빌드는 jsx-ast-utils(CommonJS)를 이름으로 불러와 Node에서 깨진다. CommonJS 빌드로 읽는다
const montage = createRequire(import.meta.url)("@montage-ui/eslint-plugin");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 몽타주 접근성 규칙: 아이콘 버튼의 aria-label, 이미지의 alt (spec 5.1)
  montage.flatConfig.recommended,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 보드의 디자인 레이어에서 그대로 옮긴 그리기 엔진(자바스크립트)
    "lib/orchard/*.js",
  ]),
]);

export default eslintConfig;
