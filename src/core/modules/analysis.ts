import { ClairModule } from "./clair";
import { PreOperatorData, PreOperatorResult } from "../operator";
import { ProcessInfo } from "@/controllers/generator.controller";
import { GeneratorModule, GeneratorOutput } from "@/interfaces/generators.interface";

export class AnalysisModule extends ClairModule {
  static async _preOperate({ module, generator, meta }: PreOperatorData & { module: GeneratorModule }): Promise<{ data: PreOperatorResult, result: ProcessInfo }> {
    let jsonOutputs = generator.instructions.output;
    if (!Array.isArray(jsonOutputs)) jsonOutputs = [jsonOutputs];

    const newOutputs: GeneratorOutput[] = jsonOutputs.map(output => {
      const newOutputSchema = { ...output.schema };

      if (!newOutputSchema.properties) newOutputSchema.properties = {};
      newOutputSchema.properties._analysis = {
        type: 'string',
        description: 'Your short analysis of the request and the response you generate.',
      };

      if (!newOutputSchema.required) newOutputSchema.required = [];
      newOutputSchema.required.push('_analysis');

      return { ...output, schema: newOutputSchema };
    });

    const newGenerator = { ...generator, instructions: { ...generator.instructions, output: newOutputs } };

    return {
      data: { success: true, cost: 0, generator: newGenerator, meta },
      result: { status: 'success', module: module.name, cost: 0, retries: 0 },
    };
  }
}