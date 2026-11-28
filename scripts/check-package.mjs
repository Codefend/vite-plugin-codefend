import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const commonjs = require(resolve(root, manifest.main));
const esm = await import(pathToFileURL(resolve(root, manifest.module)).href);
const vitePackage = process.env.CODEFEND_VITE_PACKAGE || "vite";
const { build } = await import(vitePackage);

assert.deepEqual(Object.keys(commonjs), ["codefend"]);
assert.deepEqual(Object.keys(esm), ["codefend"]);
for (const entry of [manifest.main, manifest.module, manifest.types, "dist/index.d.mts"]) {
  assert.ok(readFileSync(resolve(root, entry)).length, "Missing package entry: " + entry);
}
for (const entry of [manifest.main, manifest.module]) {
  assert.ok(readFileSync(resolve(root, entry), "utf8").includes("sourceMappingURL="));
  const map = JSON.parse(readFileSync(resolve(root, entry + ".map"), "utf8"));
  assert.ok(map.sources.length > 0 && map.sourcesContent.length > 0);
}

const fixtureParent = realpathSync.native(tmpdir());
const fixture = mkdtempSync(join(fixtureParent, "codefend-vite-package-"));
try {
  writeFileSync(
    join(fixture, "entry.js"),
    'import { m_add } from "./math.js"; export default function run(l_external) { return m_add(l_external, 3); }',
  );
  writeFileSync(join(fixture, "math.js"), "export function m_add(m_left, m_right) { return m_left + m_right; }");
  for (const api of [commonjs, esm]) {
    for (const parserName of ["codeOnly", "startWithMAndUnderscore"]) {
      const plugin = api.codefend({ parser: { name: parserName }, debug: { stats: false } });
      assert.equal(plugin.name, "vite-plugin-codefend");
      assert.equal(plugin.apply, "build");
      assert.equal(plugin.enforce, "post");
      assert.equal(plugin.transform("const m_value = 1;"), "const Ox0 = 1;");
      const result = await build({
        root: fixture,
        configFile: false,
        logLevel: "silent",
        plugins: [api.codefend({ parser: { name: parserName }, debug: { stats: false } })],
        build: {
          write: false,
          minify: false,
          lib: { entry: join(fixture, "entry.js"), formats: ["cjs"], fileName: () => "bundle.cjs" },
        },
      });
      const output = Array.isArray(result) ? result[0] : result;
      assert.ok(output && "output" in output);
      const chunk = output.output.find((item) => item.type === "chunk");
      assert.ok(chunk);
      assert.doesNotMatch(chunk.code, /\bm_(?:add|left|right)\b/);
      if (parserName === "startWithMAndUnderscore") assert.match(chunk.code, /\bl_external\b/);
      else assert.doesNotMatch(chunk.code, /\bl_external\b/);
      const module = { exports: {} };
      vm.runInNewContext(chunk.code, { module, exports: module.exports });
      assert.equal(module.exports(2), 5);
    }
  }
} finally {
  if (dirname(resolve(fixture)) !== resolve(fixtureParent) || !basename(fixture).startsWith("codefend-vite-package-")) {
    throw new Error("Refusing to remove a directory outside the package fixtures.");
  }
  rmSync(fixture, { recursive: true, force: true });
}

const core = JSON.parse(readFileSync(resolve(dirname(require.resolve("codefend")), "../package.json"), "utf8"));
const vite = JSON.parse(readFileSync(require.resolve(vitePackage + "/package.json"), "utf8"));
console.log(
  JSON.stringify({
    node: process.version,
    plugin: manifest.version,
    codefend: core.version,
    vite: vite.version,
    parsers: ["codeOnly", "startWithMAndUnderscore"],
    checks: ["CommonJS", "ESM", "declarations", "source maps", "Vite compilation/execution"],
  }),
);
