import { Draft07 } from "json-schema-library";
import {ClairModule } from "./clair";
import { PostOperatorData, PostOperatorResult } from "../operator";

export class ComplianceModule extends ClairModule {
  static async operate({command, app, options, data}: PostOperatorData): Promise<PostOperatorResult> {
    const json = JSON.parse(data.result[0]);
    const responseFormat = app.appFunctions.find(appFunction => appFunction.path === command).response;

    const schema = new Draft07(responseFormat);
    const errors = schema.validate(json);

    if (errors.length > 0) {
      return { success: false, retry: true, error: this.formatError(errors[0].message) };
    }

    return { success: true, creditCost: 0, data };
  }
}