import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  define: { __BUILD_LABEL__: JSON.stringify("Review prototype 01") },
  server: { host: "0.0.0.0", port: 5240, strictPort: true },
});
