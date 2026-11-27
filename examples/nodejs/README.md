# vite-plugin-codefend-example

This example builds a Node.js library with Vite and the local `vite-plugin-codefend` checkout. Use Node.js 24 for the example's Vite version.

Build the plugin first from the repository root:

```bash
npm ci --include=dev --include=optional --bin-links
npm run build
```

Then run these commands from `examples/nodejs`:

```bash
npm ci --include=dev --include=optional --bin-links
npm run build
npm start
```

Vite writes `dist/bundle.cjs`. Running it prints:

```text
secret: 123456
node_modules: node_modules
result: 5
```

The `c_`, `f_`, `p_`, and `l_` names in `src/calculator.js` and `src/main.js` receive generated names. The `static` replacement changes `predefined_secret` to `123456`, while `ignore` preserves `node_modules`. See [vite.config.js](./vite.config.js) for the options.
