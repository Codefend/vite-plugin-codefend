import { afterEach, describe, expect, it, vi } from "vitest";
import { codefend } from "..";

const SOURCE = "const l_variable = 1;";

describe("Transformation", () => {
  afterEach(() => vi.restoreAllMocks());

  it("obfuscates matching names using the default prefix", () => {
    expect(codefend().transform(SOURCE)).toBe("const Ox0 = 1;");
  });

  it("supports a custom prefix", () => {
    expect(codefend({ transformation: { prefix: "Ax" } }).transform(SOURCE)).toBe("const Ax0 = 1;");
  });

  it("preserves ignored names", () => {
    expect(codefend({ transformation: { ignore: ["l_variable"] } }).transform(SOURCE)).toBe(SOURCE);
  });

  it("uses explicit static replacements", () => {
    const plugin = codefend({ transformation: { static: [{ from: "l_variable", to: "secret" }] } });

    expect(plugin.transform(SOURCE)).toBe("const secret = 1;");
  });

  it.each(["First Second", ["First", "Second"]])("accepts a word pool: %j", (pool) => {
    const plugin = codefend({ transformation: { pool } });

    expect(plugin.transform("const l_first = l_second;")).toBe("const first = second;");
  });

  it("shares mappings between modules and retains them after output generation", () => {
    const plugin = codefend({ debug: { stats: false } });
    const exported = plugin.transform("export const l_shared = 5;");
    const transformedName = exported.match(/export const (\w+) = 5;/)?.[1];

    expect(transformedName).toBeTruthy();
    plugin.generateBundle();
    expect(plugin.transform('import { l_shared } from "shared"; console.log(l_shared);')).toBe(
      `import { ${transformedName} } from "shared"; console.log(${transformedName});`,
    );
  });

  it("isolates mappings between plugin instances", () => {
    codefend().transform("const l_other = 1;");

    expect(codefend().transform(SOURCE)).toBe("const Ox0 = 1;");
  });

  it("preserves generated Rolldown runtime helpers", () => {
    const plugin = codefend();
    const runtime = "var __share_factories = {}; function __share_require() {}";

    expect(plugin.transform(runtime, "\0rolldown/runtime.js")).toBe(runtime);
    expect(plugin.transform(SOURCE, "\0virtual-user-module")).toBe("const Ox0 = 1;");
  });

  it("preserves Vite internal helpers", () => {
    const plugin = codefend();
    const helper = "if (__VITE_IS_MODERN__) return l_value;";

    expect(plugin.transform(helper, "\0vite/preload-helper.js")).toBe(helper);
  });

  it("preserves asset references, URL suffixes, and preload markers within user modules", () => {
    const plugin = codefend({ transformation: { static: [{ from: "VITE_ASSET", to: "changed" }] } });
    const asset = "__VITE_ASSET__B2_assetX__$_/path_under?query_value__";

    expect(plugin.transform(`const l_value = "${asset}"; const l_other = __VITE_PRELOAD__;`)).toBe(
      `const Ox0 = "${asset}"; const Ox1 = __VITE_PRELOAD__;`,
    );
  });

  it("assigns unique pool names across protected Vite placeholders within one module", () => {
    const plugin = codefend({ transformation: { pool: ["alpha", "beta", "gamma"] } });
    const source = 'const l_one=1; const l_url="__VITE_ASSET__B2_assetX__"; const l_two=2;';

    expect(plugin.transform(source)).toBe('const alpha=1; const beta="__VITE_ASSET__B2_assetX__"; const gamma=2;');
  });

  it("preserves complete Vite preload hashes when a static replacement matches the hash", () => {
    const hash = "abcdef0123456789abcdef0123456789ab";
    const plugin = codefend({ transformation: { static: [{ from: hash, to: "changed" }] } });

    expect(plugin.transform(`const l_preload = "__VITE_PRELOAD__${hash}";`)).toBe(
      `const Ox0 = "__VITE_PRELOAD__${hash}";`,
    );
  });

  it("preserves existing private characters while restoring multiple placeholders", () => {
    const plugin = codefend();
    const text = "\uE000\uE010\uE001";
    const placeholders = Array.from({ length: 12 }, (_, index) => `"__VITE_ASSET__asset${index}__"`).join(", ");

    expect(plugin.transform(`const l_text = "${text}"; const l_assets = [${placeholders}];`)).toBe(
      `const Ox0 = "${text}"; const Ox1 = [${placeholders}];`,
    );
  });

  it.each(["ROLLUP", "ROLLDOWN"])("preserves %s file URL expressions within user modules", (bundler) => {
    const plugin = codefend();

    expect(plugin.transform(`const l_url = import.meta.${bundler}_FILE_URL_B2_assetX;`)).toBe(
      `const Ox0 = import.meta.${bundler}_FILE_URL_B2_assetX;`,
    );
  });

  it("reports the count of every repeated match", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const plugin = codefend();

    expect(plugin.transform("l_value l_value l_value")).toBe("Ox0 Ox0 Ox0");
    plugin.generateBundle();

    expect(log).toHaveBeenCalledWith(expect.stringMatching(/l_value.*Ox0.*3/));
  });

  it("supports silent statistics", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const plugin = codefend({ debug: { stats: false } });

    plugin.transform(SOURCE);
    plugin.generateBundle();

    expect(log).not.toHaveBeenCalled();
  });
});
