import { Completion } from "@/services/openai.service";
import { PostModuleOption, postModules, preModules } from "./types/modules";
import { Generator, GeneratorFunction, GeneratorModule } from "@/interfaces/generators.interface";

type OperatorSuccess = {
  success: true,
  generator: Generator,
  cost: number,
}

type PreOperatorSuccess = OperatorSuccess;

type PostOperatorSuccess = OperatorSuccess & {
  completion: Completion,
}

type OperatorError = {
  success: false,
  retry: boolean,
  error: string,
}

export type PreOperatorResult = PreOperatorSuccess | OperatorError;

export type PostOperatorResult = PostOperatorSuccess | OperatorError;

export class Operator {
  static async postOperate(generator: Omit<Generator, 'flow'>, modules: GeneratorModule[], completion: Completion): Promise<PostOperatorResult> {
    let finalResult: PostOperatorResult = { success: true, cost: 0, generator, completion };

    for (const module of modules) {
      const operator = postModules[module.name].operator;
      if (operator === undefined) {
        console.log(`No operator for module ${module}`);
        continue;
      }
      const result = await operator.operate(generator, completion);
      if (result.success === false) {
        console.log(`${operator.name} error`, result.error);
        return result;
      }
      console.log(`${operator.name} success`)
      finalResult = result;
    }
    return finalResult;
  }

  static async preOperate(generator: Omit<Generator, 'flow'>, modules: GeneratorModule[]): Promise<PreOperatorResult> {
    let finalResult: PreOperatorResult = { success: true, cost: 0, generator};

    for (const module of modules) {
      const operator = preModules[module.name].operator;
      if (operator === undefined) {
        console.log(`No operator for module ${module}`);
        continue;
      }
      const result = await operator.operate(generator);
      if (result.success === false) {
        console.log(`${operator.name} error`, result.error);
        return result;
      }
      console.log(`${operator.name} success`)
      finalResult = result;
    }
    return finalResult;
  }
}