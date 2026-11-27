import { IViteCodefendInternalOptions, IViteCodefendOptions } from "../data/Types";
import OptionsAdapter from "./OptionsAdapter";
import OptionsValidator from "./OptionsValidator";

export class OptionsBuilder {
  name: string;
  libraryOptions!: IViteCodefendInternalOptions;
  pluginOptions!: IViteCodefendOptions;
  additionalIgnoredWords: string[] = [];

  constructor(name: string) {
    this.name = name;
  }

  setOptions(pluginOptions: IViteCodefendOptions): this {
    this.pluginOptions = pluginOptions;
    return this;
  }

  setAdditionalIgnoredWords(additionalIgnoredWords: string[]): this {
    this.additionalIgnoredWords = additionalIgnoredWords;
    return this;
  }

  build(): IViteCodefendInternalOptions {
    OptionsValidator.validateOptions(this.name, this.pluginOptions);
    this.libraryOptions = OptionsAdapter.transform(this.pluginOptions);

    this.additionalIgnoredWords.forEach((word) => {
      this.libraryOptions.transformation?.ignore!.push(word);
    });
    return this.libraryOptions;
  }
}
