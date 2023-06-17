import { Completion, OpenAiService, SuccesfulCompletion } from '@/services/openai.service';
import { NextFunction, Response, Request } from 'express';
import { Container } from 'typedi';
import { Operator } from '@/core/operator';
import { isPostModuleOption, isPreModuleOption, modules } from '@/core/types/modules';
import { Generator } from '@/interfaces/generators.interface';
import { GeneratorDto } from '@/dtos/generators.dto';

export const MAX_COMPLETION_RETRIES = 4;

type CallProps = {
  generator: Generator;
  retry: { count: number, cost: number };
  res: Response;
  next: NextFunction;
}

type BaseProcessInfo = {
  module: string;
  cost: number;
  retries: number;
}

type SuccesfulProcessInfo = BaseProcessInfo & {
  status: 'success';
}

type FailedProcessInfo = BaseProcessInfo & {
  status: 'failed';
  error: string;
}

export type ProcessInfo = SuccesfulProcessInfo | FailedProcessInfo;

export type Meta = {
  version: string;
  model: 'gpt-3.5-turbo' | 'gpt-4';
  cost: number;
  retries: number;
  process: { [P in keyof typeof modules]?: ProcessInfo };
};

export class GeneratorController {
  public openAI = Container.get(OpenAiService);

  public generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const generator: GeneratorDto = req.body;

      return this.call({ generator, retry: { count: 0, cost: 0 }, res, next });
    } catch (error) {
      next(error);
    }
  };

  private async call({generator, retry, res, next}: CallProps): Promise<void> {
    let validatedGenerator: Generator = { ...generator };

    const { flow } = validatedGenerator;

    let { count: retryCount, cost: retryCost } = { ...retry };

    let meta: Meta = {
      version: process.env.npm_package_version,
      model: generator.settings.model,
      cost: retryCost,
      retries: retryCount,
      process: {},
    };

    const flowOptions = flow || [{ type: 'generate' }];

    // PRE PROCESSING
    const preValidate = await Operator.preOperate({ generator: validatedGenerator, modules: flowOptions.filter(isPreModuleOption).map((option) => option.module), meta });

    if (preValidate.success === true) {
      retryCost += preValidate.cost;
      validatedGenerator = { ...preValidate.generator };
    }
    // No retry for pre processing as completion is not called yet
    else {
      throw new Error(preValidate.error);
    }

    const completion = await this.openAI.getCompletion(validatedGenerator);

    if (completion.type === 'error') {
      throw new Error(completion.error);
    }

    console.log('#LOG#', 'GENERATION OK', JSON.stringify(completion));

    // POST MODULES OPERATIONS
    const postValidate = await Operator.postOperate({ generator: validatedGenerator, modules: flowOptions.filter(isPostModuleOption).map((option) => option.module), meta, completion });

    if (postValidate.success === true) {
      retryCost += postValidate.cost;

      if (isSuccesfulCompletion(postValidate.completion)) {
        // @TODO: Handle functions, chains etc
        try {
          const data = JSON.parse(postValidate.completion.data);
          res.status(200).json({ data });
        }
        catch (error) {
          throw new Error('Invalid JSON');
        }
      }
      else {
        throw new Error(postValidate.completion.error);
      }
    }
    else if (postValidate.retry === true) {
      if (retryCount > MAX_COMPLETION_RETRIES) {
        return next(new Error('Max retries reached'));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Retrying after error', postValidate.error);
      return this.call({ generator: validatedGenerator, retry: { count: retryCount + 1, cost: retryCost }, res, next });
    }
    else {
      throw new Error(postValidate.error);
    }
  }
}

function isSuccesfulCompletion(completion: Completion): completion is SuccesfulCompletion {
  return (completion as SuccesfulCompletion).data !== undefined;
}