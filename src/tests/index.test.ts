import { describe, expect, it } from "vitest";
import { resolveConfig, type Plugin } from "vite";
import { codefend, type IViteCodefendOptions } from "..";
import { DEFAULT_PARSER_REGEX_LIST, DEFAULT_TRANSFORMATION_PREFIX } from "../data/Constants";

describe("Plugin configuration", () => {
  it("provides a native Vite build plugin", () => {
    const plugin: Plugin = codefend();

    expect(plugin.name).toBe("vite-plugin-codefend");
    expect(plugin.apply).toBe("build");
    expect(plugin.enforce).toBe("post");
  });

  it("uses the shared Codefend defaults", () => {
    const { ___options } = codefend();

    expect(___options.transformation.prefix).toBe(DEFAULT_TRANSFORMATION_PREFIX);
    expect(___options.transformation.ignore).toEqual([]);
    expect(___options.transformation.static).toEqual([]);
    expect(___options.debug.stats).toBe(true);
    expect(___options.parser.regexList).toEqual(DEFAULT_PARSER_REGEX_LIST);
  });

  it.each([
    { options: { debug: { stats: "yes" } }, property: /stats/ },
    { options: { transformation: { prefix: 42 } }, property: /prefix/ },
    { options: { transformation: { ignore: "l_value" } }, property: /ignore/ },
    { options: { transformation: { pool: [42] } }, property: /pool/ },
    { options: { transformation: { static: [{ from: "l_value" }] } }, property: /to/ },
    { options: { transformation: null }, property: /transformation/ },
    { options: { debug: { ignoredWarnings: [] } }, property: /ignoredWarnings/ },
    { options: { unknown: true }, property: /unknown/ },
  ])("rejects invalid options through schema-utils: $options", ({ options, property }) => {
    const create = () => codefend(options as unknown as IViteCodefendOptions);

    expect(create).toThrowError(expect.objectContaining({ name: "ValidationError" }));
    expect(create).toThrowError(property);
    expect(create).toThrowError(/vite-plugin-codefend/);
  });

  it("is excluded from Vite development configuration", async () => {
    const config = await resolveConfig({ configFile: false, logLevel: "silent", plugins: [codefend()] }, "serve");

    expect(config.plugins.some((plugin) => plugin.name === "vite-plugin-codefend")).toBe(false);
  });
});
