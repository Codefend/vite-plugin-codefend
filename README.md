<p align="center">
 <img src="./public/img/logo.png">
</p>

# vite-plugin-codefend

[![Latest CI workflow status](https://img.shields.io/github/actions/workflow/status/Codefend/vite-plugin-codefend/ci.yaml)](https://github.com/Codefend/vite-plugin-codefend/actions/workflows/ci.yaml)
![NPM](https://img.shields.io/npm/dt/vite-plugin-codefend)
[![npm unpacked size](https://img.shields.io/npm/unpacked-size/vite-plugin-codefend)](https://www.npmjs.com/package/vite-plugin-codefend)
![NPM](https://img.shields.io/node/v/vite-plugin-codefend)
![NPM](https://img.shields.io/npm/l/vite-plugin-codefend)

Vite plugin for code obfuscation based on [Codefend](https://www.npmjs.com/package/codefend).

Supports Vite 6.4.6 and newer within Vite 6, 7, and 8. The plugin requires Node.js 18 or newer; use a Node.js version supported by your installed Vite version. Development and CI use Node.js 24.

## Installation

```bash
npm install -D vite-plugin-codefend
```

## Usage

Add the plugin to your `vite.config.js` or `vite.config.ts`:

```js
import { defineConfig } from "vite";
import { codefend } from "vite-plugin-codefend";

export default defineConfig({
  plugins: [codefend()],
});
```

The plugin runs during `vite build` and applies after framework transforms. The development server and HMR retain their usual behavior. Options use the same `transformation` and `debug` structure as the Rollup and Webpack plugins and are validated with `schema-utils`.

### Custom options

```js
import { defineConfig } from "vite";
import { codefend } from "vite-plugin-codefend";

export default defineConfig({
  plugins: [
    codefend({
      transformation: {
        // Prefix for generated identifiers.
        prefix: "Ox",

        // Explicit replacements take precedence over generated names.
        static: [{ from: "predefined_secret", to: "123456" }],

        // Words that should retain their original spelling.
        ignore: ["node_modules"],

        // Optional names to use before generating prefixed identifiers.
        pool: ["QueenOfHeart"],
      },
      debug: {
        stats: true,
      },
    }),
  ],
});
```

`transformation.ignore` contains words, rather than file paths or module filters. Statistics are enabled by default; use `debug: { stats: false }` to disable them.

### Naming convention

Codefend uses its `codeOnly` parser to select words with a prefix such as `l_`. For example:

```js
const l_value = 42;
console.log(l_value);
```

With default options this becomes:

```js
const Ox0 = 42;
console.log(Ox0);
```

One mapping is shared across the modules handled by a plugin instance, so matching names in imports and exports receive consistent replacements. Vite's internal helper modules, generated asset and preload markers, and Rolldown runtime module are preserved.

Transformations operate on the module text supplied by Vite. Review public export names, strings, and property names that must remain compatible with external code, and add those words to `transformation.ignore` when needed. This plugin does not provide a separate HTML or CSS asset transformation step.

See the [Codefend configuration reference](https://codefend.github.io/docs/references/configuration) for transformation options.

## Example

The [Node.js library example](./examples/nodejs/) builds a calculator through Vite and the local plugin checkout.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development commands and the CI workflow.

## License

[MIT](./LICENSE.md)
