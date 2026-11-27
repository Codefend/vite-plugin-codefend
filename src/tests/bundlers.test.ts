import fs from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { codefend } from "..";

const bundlers = [
  { name: "Vite 6", load: () => import("vite-6") },
  { name: "Vite 7", load: () => import("vite-7") },
  { name: "Vite 8", load: () => import("vite") },
];

function createFixture(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codefend-vite-test-"));
  for (const [name, source] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, name), source);
  }
  return root;
}

function removeFixture(root: string): void {
  if (
    path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir()) ||
    !path.basename(root).startsWith("codefend-vite-test-")
  ) {
    throw new Error("Refusing to remove a directory outside the test fixtures.");
  }
  fs.rmSync(root, { recursive: true, force: true });
}

function execute(code: string): unknown {
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports });
  return module.exports;
}

describe.each(bundlers)("$name compatibility", ({ load }) => {
  it("builds and executes a library with shared names across modules", async () => {
    const { build } = await load();
    const root = createFixture({
      "entry.js": 'import { l_add } from "./math.js"; export default l_add(2, 3);',
      "math.js": "export function l_add(l_left, l_right) { return l_left + l_right; }",
    });
    try {
      const result = await build({
        root,
        configFile: false,
        logLevel: "silent",
        plugins: [codefend({ debug: { stats: false } })],
        build: {
          write: false,
          minify: false,
          lib: { entry: path.join(root, "entry.js"), formats: ["cjs"], fileName: () => "bundle.cjs" },
        },
      });
      const output = Array.isArray(result) ? result[0] : result;
      if (!output || !("output" in output)) throw new Error("Expected a library output");
      const chunk = output.output.find((item) => item.type === "chunk");
      if (!chunk || chunk.type !== "chunk") throw new Error("Missing JavaScript chunk");

      expect(chunk.code).not.toMatch(/\bl_(?:add|left|right)\b/);
      expect(execute(chunk.code)).toBe(5);
    } finally {
      removeFixture(root);
    }
  });

  it("runs after framework transforms regardless of plugin array order", async () => {
    const { build } = await load();
    const root = createFixture({ "entry.js": "export default COMPILED;" });
    try {
      const result = await build({
        root,
        configFile: false,
        logLevel: "silent",
        plugins: [
          codefend({ debug: { stats: false } }),
          {
            name: "fixture-framework",
            transform(_source: string, id: string) {
              if (!id.endsWith("/entry.js")) return null;
              return "function l_compute(l_value) { return l_value * 2; } export default l_compute(4);";
            },
          },
        ],
        build: {
          write: false,
          minify: false,
          lib: { entry: path.join(root, "entry.js"), formats: ["cjs"], fileName: () => "bundle.cjs" },
        },
      });
      const output = Array.isArray(result) ? result[0] : result;
      if (!output || !("output" in output)) throw new Error("Expected a library output");
      const chunk = output.output.find((item) => item.type === "chunk");
      if (!chunk || chunk.type !== "chunk") throw new Error("Missing JavaScript chunk");

      expect(chunk.code).not.toMatch(/\bl_(?:compute|value)\b/);
      expect(execute(chunk.code)).toBe(8);
    } finally {
      removeFixture(root);
    }
  });

  it("executes a dynamically imported chunk with consistent mappings", async () => {
    const { build } = await load();
    const root = createFixture({
      "entry.js":
        'export default async function l_run() { const { l_double } = await import("./lazy.js"); return l_double(21); }',
      "lazy.js": "export function l_double(l_value) { return l_value * 2; }",
    });
    try {
      const result = await build({
        root,
        configFile: false,
        logLevel: "silent",
        plugins: [codefend({ debug: { stats: false } })],
        build: {
          minify: false,
          lib: { entry: path.join(root, "entry.js"), formats: ["es"], fileName: () => "bundle.mjs" },
          rollupOptions: { output: { chunkFileNames: "[name]-[hash].mjs" } },
        },
      });
      const output = Array.isArray(result) ? result[0] : result;
      if (!output || !("output" in output)) throw new Error("Expected a library output");
      const chunks = output.output.filter((item) => item.type === "chunk");

      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) expect(chunk.code).not.toMatch(/\bl_(?:run|double|value)\b/);
      const entry = await import(pathToFileURL(path.join(root, "dist/bundle.mjs")).href);
      await expect(entry.default()).resolves.toBe(42);
    } finally {
      removeFixture(root);
    }
  });

  it("runs an application with Vite preload helpers and emitted asset URLs", async () => {
    const { build } = await load();
    const root = createFixture({
      "index.html": '<html><body><script type="module" src="/entry.js"></script></body></html>',
      "entry.js":
        'import l_url from "./picture.svg"; globalThis.assetUrl = l_url; globalThis.result = import("./lazy.js").then(({ l_double }) => l_double(21));',
      "lazy.js": "export function l_double(l_value) { return l_value * 2; }",
      "picture.svg": '<svg xmlns="http://www.w3.org/2000/svg"><circle r="1"/></svg>',
    });
    try {
      const result = await build({
        root,
        configFile: false,
        logLevel: "silent",
        plugins: [codefend({ debug: { stats: false } })],
        build: {
          minify: false,
          assetsInlineLimit: 0,
          rollupOptions: {
            output: { entryFileNames: "assets/[name]-[hash].mjs", chunkFileNames: "assets/[name]-[hash].mjs" },
          },
        },
      });
      const output = Array.isArray(result) ? result[0] : result;
      if (!output || !("output" in output)) throw new Error("Expected an application output");
      const entry = output.output.find((item) => item.type === "chunk" && item.isEntry);
      const asset = output.output.find((item) => item.type === "asset" && item.fileName.endsWith(".svg"));
      if (!entry || entry.type !== "chunk" || !asset) throw new Error("Missing application entry or asset");

      expect(entry.code).not.toMatch(/__VITE_|\bl_(?:url|double)\b/);
      expect(entry.code).toContain("/" + asset.fileName);
      const runner = `
        import assert from "node:assert/strict";
        globalThis.document = {
          createElement: () => ({ relList: { supports: () => true } }),
          querySelector: () => null,
        };
        await import(${JSON.stringify(pathToFileURL(path.join(root, "dist", entry.fileName)).href)});
        assert.equal(await globalThis.result, 42);
        assert.equal(globalThis.assetUrl, ${JSON.stringify("/" + asset.fileName)});
      `;
      execFileSync(process.execPath, ["--input-type=module", "-e", runner], { timeout: 10_000, stdio: "pipe" });
    } finally {
      removeFixture(root);
    }
  });
});
