import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Backwards-compatible shims so existing components keep working
      // without changing every import after the TanStack Start → React SPA migration.
      "@tanstack/react-router": path.resolve(__dirname, "./src/compat/tanstack-router.tsx"),
      "@tanstack/react-start": path.resolve(__dirname, "./src/compat/tanstack-start.ts"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
});
