import { Completion, SuccesfulCompletion } from '@/services/openai.service';
import { operatingModules } from './types/modules';
import { Generator, GeneratorModule } from '@/interfaces/generators.interface';
import { Meta } from '@/controllers/generator.controller';
import { ClairModule } from './modules/clair';
import { get } from 'http';
import { ModuleName, ModuleOptionValue } from 'otomat-types-ts';

type BaseOperatorData = {
  generator: Generator;
  modules: GeneratorModule<ModuleName>[];
  meta: Meta;
};

export type PreOperatorData = BaseOperatorData;

export type PostOperatorData = BaseOperatorData & {
  completion: SuccesfulCompletion;
};

type BaseOperatorSuccess = {
  success: true;
  generator: Generator;
  meta: Meta;
};

type PreOperatorSuccess = BaseOperatorSuccess;

type PostOperatorSuccess = BaseOperatorSuccess & {
  completion: Completion;
};

type OperatorError = {
  success: false;
  error: string;
  meta: Meta;
};

type PreOperatorError = OperatorError;

type PostOperatorError = OperatorError & {
  retry: boolean;
};

export type PreOperatorResult = PreOperatorSuccess | PreOperatorError;

export type PostOperatorResult = PostOperatorSuccess | PostOperatorError;

export class Operator {
  static async postOperate({ generator, modules, meta, completion }: PostOperatorData): Promise<PostOperatorResult> {
    let finalResult: PostOperatorResult = { success: true, generator, meta, completion };

    console.log('#DBG#', 'MODULES', modules);

    for (const module of modules) {
      const operator: typeof ClairModule = operatingModules[module.name].operator;
      if (operator === undefined) {
        console.log(`No operator for module ${module}`);
        continue;
      }

      const result = await operator.postOperate({ module: moduleWithDefaults(module), generator, modules, meta, completion });
      if (result.success === false) {
        console.log(`${operator.name} error`, result.error);
        return result;
      }
      console.log(`${operator.name} success`);
      finalResult = result;
    }
    return finalResult;
  }

  static async preOperate({ generator, modules, meta }: PreOperatorData): Promise<PreOperatorResult> {
    let finalResult: PreOperatorResult = { success: true, generator, meta };

    console.log('#DBG#', 'MODULES', modules);

    for (const module of modules) {
      const operator: typeof ClairModule = operatingModules[module.name].operator;
      if (operator === undefined) {
        console.log(`No operator for module ${module}`);
        continue;
      }
      const result = await operator.preOperate({ module: moduleWithDefaults(module), generator, modules, meta });
      if (result.success === false) {
        console.log(`${operator.name} error`, result.error);
        return result;
      }
      console.log(`${operator.name} success`);
      finalResult = result;
    }
    return finalResult;
  }
}

function moduleWithDefaults<T extends ModuleName>(module: GeneratorModule<T>): GeneratorModule<T> {
  const options: ModuleOptionValue<T> = {};

  const moduleDefinition = operatingModules[module.name];
  console.log('#DBG#', 'MODULE DEFINITION', moduleDefinition);

  if (!moduleDefinition.options) return module;

  Object.entries(moduleDefinition.options).forEach(([optionName, optionDefinition]) => {
    options[optionName] = module.options?.[optionName] ?? optionDefinition.default;
  });

  return {
    ...module,
    options,
  };
}
