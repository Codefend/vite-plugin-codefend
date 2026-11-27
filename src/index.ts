import { buildRuntimeOptions, obfuscate, stats } from "codefend";
import { ROLLDOWN_RUNTIME_MODULE_ID, VITE_INTERNAL_MODULE_PREFIX, VITE_PLACEHOLDER_REGEX } from "./data/Constants";
import type { IViteCodefend, IViteCodefendOptions } from "./data/Types";
import { OptionsBuilder } from "./options/OptionsBuilder";

export type { IViteCodefend, IViteCodefendOptions } from "./data/Types";

export const codefend = (options?: IViteCodefendOptions): IViteCodefend => {
  const name = "vite-plugin-codefend";
  const runtimeOptions = buildRuntimeOptions();
  const ___options = new OptionsBuilder(name).setOptions(options ?? {}).build();

  return {
    name,
    apply: "build",
    enforce: "post",
    transform(code: string, id?: string): string {
      if (id === ROLLDOWN_RUNTIME_MODULE_ID || id?.startsWith(VITE_INTERNAL_MODULE_PREFIX)) return code;

      let markerPrefix = "\uE000";
      while (code.includes(markerPrefix)) markerPrefix += "\uE000";
      const placeholders = new Map<string, string>();
      const maskedCode = code.replace(VITE_PLACEHOLDER_REGEX, (placeholder) => {
        const index = String(placeholders.size)
          .split("")
          .map((digit) => String.fromCharCode(0xe010 + Number(digit)))
          .join("");
        const marker = markerPrefix + index + "\uE001";
        placeholders.set(marker, placeholder);
        return marker;
      });

      // Obfuscate each module once so pool names remain unique across protected placeholders.
      const transformed = obfuscate(maskedCode, ___options.transformation, ___options.parser, runtimeOptions);
      if (!placeholders.size) return transformed;
      return transformed.replace(new RegExp(markerPrefix + "[\uE010-\uE019]+\uE001", "g"), (marker) => {
        return placeholders.get(marker)!;
      });
    },
    generateBundle(): void {
      stats({ stats: ___options.debug.stats }, runtimeOptions);
    },
    ___options,
  };
};
