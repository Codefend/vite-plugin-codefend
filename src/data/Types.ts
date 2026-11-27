import type {
  ICodefendDebugOptions,
  ICodefendTransformationOptions,
  ICodefendInternalDebugOptions,
  ICodefendInternalParserOptions,
  ICodefendInternalTransformationOptions,
} from "codefend";

export type IViteCodefend = {
  name: "vite-plugin-codefend";
  apply: "build";
  enforce: "post";
  transform(code: string, id?: string): string;
  generateBundle: () => void;
  ___options: IViteCodefendInternalOptions;
};
export type IViteCodefendOptions = {
  transformation?: ICodefendTransformationOptions;
  debug?: IViteCodefendDebugOptions;
};

export type IViteCodefendInternalOptions = {
  transformation: ICodefendInternalTransformationOptions;
  debug: ICodefendInternalDebugOptions;
  parser: ICodefendInternalParserOptions;
};

type IViteCodefendDebugOptions = Omit<ICodefendDebugOptions, "ignoredWarnings">;
