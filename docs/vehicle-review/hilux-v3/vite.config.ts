import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  define: { __BUILD_LABEL__: JSON.stringify("Review prototype 03") },
  server: { host: "0.0.0.0", port: 5184, strictPort: true },
});
