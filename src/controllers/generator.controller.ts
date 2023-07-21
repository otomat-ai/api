import { Completion, OpenAiService, SuccesfulCompletion } from '@/services/openai.service';
import { NextFunction, Response, Request } from 'express';
import { Container } from 'typedi';
import { Operator } from '@/core/operator';
import { isPostModuleOption, isPreModuleOption, operatingModules } from '@/core/types/modules';
import { Generator, GeneratorModel } from '@/interfaces/generators.interface';
import { GeneratorDto } from '@/dtos/generators.dto';
import { ChatCompletionRequestMessage } from 'openai';
import fetch from 'node-fetch';
import { ModuleOptionValue } from 'otomat-types-ts';

export const DEFAULT_COMPLETION_RETRIES = 4;

type CallProps = {
  generator: Generator;
  retry: { count: number, cost: number };
  res: Response;
  next: NextFunction;
}

type BaseProcessInfo = {
  module: string;
  options: ModuleOptionValue<any>;
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
  model: GeneratorModel;
  cost: number;
  retries: number;
  process: { [P in keyof typeof operatingModules]?: ProcessInfo };
};

export class GeneratorController {
  public openAI = Container.get(OpenAiService);

  public generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const generator: GeneratorDto = req.body;

      if (generator.settings.stream) {
        const streamCallback = (token: string) => {
          console.log('#DBG#', 'NEW TOKEN', token);

          res.write(token);
          res.flush();
        };

        res.writeHead(202, { 'Content-Type': 'application/json' });
        await this.openAI.getCompletion(generator, streamCallback);
        console.log('#DBG#', 'END', );

        res.end();
      } else {
        return this.call({ generator, retry: { count: 0, cost: 0 }, res, next });
      }
    } catch (error) {
      next(error);
    }
  };

  private async stream({ generator, res, next }: { generator: Generator, res: Response, next: NextFunction }): Promise<void> {
    const streamCallback = (token: string) => {
      console.log('#DBG#', 'NEW TOKEN', token);

      res.write(token);
    };

    res.writeHead(202, { 'Content-Type': 'application/json' });
    await this.openAI.getCompletion(generator, streamCallback);
    console.log('#DBG#', 'END', );

    res.end();
  }

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

    const retries = validatedGenerator.settings.retries || DEFAULT_COMPLETION_RETRIES;

    try {
      // PRE PROCESSING
      const preValidate = await Operator.preOperate({ generator: validatedGenerator, modules: flowOptions.filter(isPreModuleOption).map((option) => option.module), meta });

      if (preValidate.success === true) {
        validatedGenerator = { ...preValidate.generator };
      }
      // No retry for pre processing as completion is not called yet
      else {
        throw new Error(preValidate.error);
      }

      const completion = await this.getCompletion({ generator: validatedGenerator });

      retryCost += completion.cost;

      // POST MODULES OPERATIONS
      const postValidate = await Operator.postOperate({ generator: validatedGenerator, modules: flowOptions.filter(isPostModuleOption).map((option) => option.module), meta, completion });

      if (postValidate.success === true) {
        if (isSuccesfulCompletion(postValidate.completion)) {
          if (postValidate.completion.type === 'function') {
            const jsonArguments = JSON.parse(postValidate.completion.data.arguments);
            res.status(200).json({ type: postValidate.completion.type, data: { ...postValidate.completion.data, arguments: jsonArguments, chain: postValidate.completion.chain }, meta: { ...postValidate.meta, cost: retryCost } });
          }
          else {
            const jsonData = JSON.parse(postValidate.completion.data);
            res.status(200).json({ type: postValidate.completion.type, data: jsonData, meta: { ...postValidate.meta, cost: retryCost } });
          }
        }
        else {
          throw new Error(postValidate.completion.error);
        }
      }
      else if (postValidate.retry === true) {
        if (retryCount > retries) {
          return next(new Error('Max retries reached'));
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Retrying after error', postValidate.error);
        return this.call({ generator: validatedGenerator, retry: { count: retryCount + 1, cost: retryCost }, res, next });
      }
      else {
        throw new Error(postValidate.error);
      }
    } catch (error) {
      next(error);
    }
  }

  private async getCompletion({ generator, cost }: { generator: Generator, cost?: number }): Promise<SuccesfulCompletion> {
    const completion = await this.openAI.getCompletion(generator);
    console.log('#DBG#', 'COMPLETION COST', completion.cost);


    let completionCost = cost || 0;

    if (completion.type === 'error') {
      throw new Error(completion.error);
    }

    console.log('#LOG#', 'GENERATION OK', JSON.stringify(completion));

    if (completion.type === 'function') {
      const { chain, data: functionData } = completion;
      const functionDefinition = generator.instructions.functions.find((f) => f.name === functionData.name);

      if (functionDefinition.type === 'endpoint') {
        let url: string = functionDefinition.url;
        let body: any = {};

        try {
          if (functionDefinition.payload === 'query') {
            const params = new URLSearchParams(functionData.arguments);
            url = `${functionDefinition.url}?${params.toString()}`;
          }

          if (functionDefinition.payload === 'body') {
            body = { body: functionData.arguments };
          }

          const response = await fetch(url, {
            method: functionDefinition.method,
            headers: functionDefinition.headers,
            ...body,
          });

          const functionResult = await response.json();

          if (chain) {
            console.log('Calling again after chain function');
            const functionHistory: ChatCompletionRequestMessage[] = [
              {
                role: 'assistant',
                function_call: completion.data,
                content: null,
              },
              {
                role: 'function',
                name: functionData.name,
                content: JSON.stringify(functionResult),
              }
            ];

            return this.getCompletion({ generator: {...generator, history: [...generator.history || [], ...functionHistory]}, cost: completionCost + completion.cost });
          }
        }
        catch (error) {
          throw error;
        }
      }
    }

    return { ...completion, cost: completionCost + completion.cost };
  }
}

function isSuccesfulCompletion(completion: Completion): completion is SuccesfulCompletion {
  return (completion as SuccesfulCompletion).data !== undefined;
}