import { Draft07 } from "json-schema-library";
import {ClairModule } from "./clair";
import { PostOperatorData, PostOperatorResult } from "../operator";
import { GeneratorModule } from "@/interfaces/generators.interface";
import { ProcessInfo } from "@/controllers/generator.controller";

export class ComplianceModule extends ClairModule {
  static async _postOperate({ module, generator, completion, meta }: PostOperatorData & { module: GeneratorModule }): Promise<{ data: PostOperatorResult, result: ProcessInfo }> {
    if (completion.type === 'json') {
      const json = JSON.parse(completion.data);

      let jsonOutputs = generator.instructions.output;
      if (!Array.isArray(jsonOutputs)) jsonOutputs = [jsonOutputs];

      jsonOutputs.forEach(output => {
        const schema = new Draft07(output.schema);
        const errors = schema.validate(json);

        if (errors.length === 0) {
          return {
            data: { success: true, cost: 0, generator, meta, completion },
            result: { status: 'success', module: module.name, cost: 0, retries: 0 },
          };
        }
      });

      return {
        data: { success: false, retry: true, meta, error: this.formatError('Response does not match any output schema') },
        result: { status: 'failed', error: this.formatError('Response does not match any output schema'), module: module.name, cost: 0, retries: 0 },
      };
    }
    else {
      const { name: functionName, arguments: functionArguments } = completion.data;

      const functionError: { data: PostOperatorResult, result: ProcessInfo } = {
        data: { success: false, retry: true, meta, error: this.formatError('Invalid function') },
        result: { status: 'failed', error: this.formatError('Invalid function'), module: module.name, cost: 0, retries: 0 },
      };

      if (!functionName || !functionArguments) {
        return functionError;
      }

      const functionCalled = completion.function;

      try {
          const jsonArguments = JSON.parse(functionArguments);
          const argumentsSchema = new Draft07(functionCalled.parameters);

          const argumentsValidation = argumentsSchema.validate(jsonArguments);
          if (argumentsValidation && argumentsValidation.length > 0) {
            return functionError;
          }
      } catch (error) {
        return functionError;
      }

      return {
        data: { success: true, cost: 0, generator, meta, completion },
        result: { status: 'success', module: module.name, cost: 0, retries: 0 },
      };
    }
  }
}