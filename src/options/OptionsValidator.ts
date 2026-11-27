import { validate } from "schema-utils";
import schema from "./schema.json";
import { JSONSchema7 } from "schema-utils/declarations/ValidationError";
import { IViteCodefendOptions } from "../data/Types";

class OptionsValidator {
  validateOptions(name: string, pluginOptions: IViteCodefendOptions): void {
    validate(schema as JSONSchema7, pluginOptions, {
      name: name,
    });
  }
}
export default new OptionsValidator();
