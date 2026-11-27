import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { codefend } from "vite-plugin-codefend";

export default defineConfig({
  plugins: [
    codefend({
      transformation: {
        prefix: "Ox",
        static: [{ from: "predefined_secret", to: "123456" }],
        ignore: ["node_modules"],
      },
      debug: {
        stats: true,
      },
    }),
  ],
  build: {
    minify: false,
    lib: {
      entry: fileURLToPath(new URL("./src/main.js", import.meta.url)),
      formats: ["cjs"],
      fileName: () => "bundle.cjs",
    },
  },
});
