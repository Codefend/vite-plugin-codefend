# Changelog

## 3.2.2

- Add the Vite plugin alongside the Codefend Rollup and Webpack plugins, using Codefend 3.2.1 and schema-utils validation.
- Share the existing transformation and debug options, adapter and builder structure, and naming convention parser.
- Apply obfuscation during Vite builds after framework transforms, keeping mappings consistent across modules and preserving Vite helpers, asset and preload markers, and the Rolldown runtime.
- Provide CommonJS and ESM packages with declarations and build source maps through tsdown.
- Add unit and integration tests, coverage, package consumption checks, Linux and Windows CI, and supported Node.js runtime checks.
- Resolve Windows temporary-directory aliases before integration and package checks so Vite 6/7 HTML builds use consistent paths.
- Include a Vite library example that builds with the local plugin checkout.
