# Contributing Guidelines

Pull requests and bug reports are welcome. Please review the [Code of Conduct](./CODE_OF_CONDUCT.md).

Use [GitHub issues](https://github.com/Codefend/vite-plugin-codefend/issues) for bugs and feature requests, and [GitHub Discussions](https://github.com/Codefend/vite-plugin-codefend/discussions) for questions.

## Development

Use Node.js 24 LTS (24.11 or newer) and npm 11 for development. The published plugin supports Node.js 18 or newer when paired with a compatible Vite version. The development tools have newer runtime requirements.

From the repository root:

```sh
npm ci --include=dev --include=optional --bin-links
npm run format:check
npm run lint:check
npm run spell:check
npm run type:check
npm run test:coverage
npm run build
npm run test:package
npm pack --dry-run
```

`prepack` runs formatting, lint, spelling, type checks, tests, the build, and package checks. Package checks load both CommonJS and ESM entry points, verify declarations and build source maps, then build and execute Vite output.

The build uses TypeScript 5 and tsdown to produce `dist/index.js`, `dist/index.mjs`, declarations, and source maps. The runtime source contains no Vite import; Vite is a peer dependency.

CI runs the same checks on Linux and Windows. Runtime checks build the plugin on Node.js 24, then consume the package on the supported Node.js versions using a compatible Vite version. No publishing workflow is configured.

## Examples

Usage examples are maintained in the [Vite example](https://codefend.github.io/docs/examples/vite) in the Codefend documentation.

## Pull requests and releases

Include tests for behavior changes and use a descriptive conventional commit, such as `fix: ...` or `chore(deps): ...`.

Releases are manual: review the version and changelog, pass the checks, and publish with maintainer approval.
