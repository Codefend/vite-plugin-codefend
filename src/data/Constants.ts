export const DEFAULT_TRANSFORMATION_PREFIX = "Ox";
export const DEFAULT_PARSER_REGEX_LIST = [
  {
    name: "main",
    regex: new RegExp("([a-zA-Z]+(_[a-zA-Z0-9]+)+)", "g"),
  },
];
export const DEFAULT_PARSER_NAME = "codeOnly";

// This generated module supplies helpers that Rolldown resolves by their original names.
export const ROLLDOWN_RUNTIME_MODULE_ID = "\0rolldown/runtime.js";

export const VITE_INTERNAL_MODULE_PREFIX = "\0vite/";

// Vite and its bundler resolve these markers to URLs and preload data after module transforms.
export const VITE_PLACEHOLDER_REGEX =
  /__VITE_PRELOAD__[a-fA-F\d]{32}|__VITE_[A-Z0-9]+(?:_[A-Z0-9]+)*__(?:[\w$]+__(?:\$_.*?__)?)?|import\.meta\.ROLL(?:UP|DOWN)_FILE_URL_[\w$]+/g;
