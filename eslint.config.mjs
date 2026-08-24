import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The demo intentionally hydrates several client-side dashboards from API
      // calls in effects. Refactoring those stable loaders is outside the public
      // portfolio hardening scope.
      "react-hooks/set-state-in-effect": "off",
      // Display-only timestamps are calculated during render in a few screens.
      "react-hooks/purity": "off",
      // User-provided project media can come from local demo storage or an
      // isolated blob host, so it is intentionally rendered without Next's
      // static image optimization pipeline.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
