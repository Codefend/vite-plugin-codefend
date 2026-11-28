import { buildDebugOptions, buildParserOptions, buildTransformationOptions } from "codefend";
import { IViteCodefendInternalOptions, IViteCodefendOptions } from "../data/Types";
import { DEFAULT_PARSER_NAME } from "../data/Constants";

class OptionsAdapter {
  transform(pluginOptions: IViteCodefendOptions): IViteCodefendInternalOptions {
    return {
      parser: buildParserOptions({ name: pluginOptions.parser?.name ?? DEFAULT_PARSER_NAME }).data!,
      transformation: buildTransformationOptions(pluginOptions.transformation),
      debug: buildDebugOptions(pluginOptions.debug),
    };
  }
}
export default new OptionsAdapter();
