import { Clair } from "@/core/clair";
import { Generator } from "@/interfaces/generators.interface";
import { ChatCompletionFunctions, ChatCompletionRequestMessage, ChatCompletionRequestMessageFunctionCall, Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai";
import { Service } from "typedi";

type BaseCompletion = {
  cost: number,
  retries: number,
}

type JSONCompletion = BaseCompletion & {
  type: 'json',
  data: any,
}

type FunctionCompletion = BaseCompletion & {
  type: 'function',
  function: ChatCompletionFunctions,
  chain: boolean,
  data: ChatCompletionRequestMessageFunctionCall,
}

// type CompletionErrorType = 'invalid_function' | 'invalid_json' | 'invalid_model' | 'token_limit_reached' | 'unknown_error';

type ErrorCompletion = BaseCompletion & {
  type: 'error',
  error: any,
  // error: CompletionErrorType,
}

export type SuccesfulCompletion = JSONCompletion | FunctionCompletion;

export type Completion = SuccesfulCompletion | ErrorCompletion;

// export class CompletionError extends Error {
//   constructor(message: CompletionErrorType) {
//     super(message);
//   }
// }

@Service()
export class OpenAiService {
  /**
   *
   */
  static getClient(apiKey: string): OpenAIApi {
    const configuration = new Configuration({apiKey});
    return new OpenAIApi(configuration);
  }

  async testKey(apiKey: string) {
    const response = await OpenAiService.getClient(apiKey).listModels();
    return response.data;
  }

  async getCompletion(generator: Generator, history?: ChatCompletionRequestMessage[]): Promise<Completion> {
    const apiKey = generator.settings.apiKey;
    if (!apiKey) throw new Error('No OpenAI key provided');

    const { messages, functions } = Clair.generatePrompt(generator);

    const request: CreateChatCompletionRequest = {
      model: generator.settings.model,
      messages: [ ...messages, ...(history || []) ],
      functions,
    }

    console.log('#DBG#', 'OPENAI REQUEST', request);

    try {
      const response = await OpenAiService.getClient(apiKey).createChatCompletion(request);

      const message = response.data.choices[0].message;

      // if (message.function_call) {
      //   const { name: functionName, arguments: functionArguments } = message.function_call;

      //   // Validate function name and arguments
      //   if (!functionName || !functionArguments) {
      //     throw new CompletionError('invalid_function');
      //   }

      //   const functionCalled = functions.find((f) => f.name === functionName);

      //   if (!functionCalled) {
      //     throw new CompletionError('invalid_function');
      //   }

      //   try {
      //       const jsonArguments = JSON.parse(functionArguments);
      //       const argumentsSchema = new Draft07(functionCalled.parameters);

      //       const argumentsValidation = argumentsSchema.validate(jsonArguments);
      //       if (argumentsValidation && argumentsValidation.length > 0) {
      //         throw new CompletionError('invalid_function');
      //       }
      //   } catch (error) {
      //     throw new CompletionError('invalid_function');
      //   }
      // }

      const usage = response.data.usage;
      const price = getUsageCost(usage, generator.settings.model);

      console.log('#DBG#', 'OPENAI RESPONSE', message);

      if (message.function_call) {
        const functionCalled = functions.find((f) => f.name === message.function_call.name);

        return {
          type: 'function',
          function: functionCalled,
          data: message.function_call,
          chain: functionCalled.chain,
          cost: price,
          retries: 0,
        }
      }

      return {
        type: 'json',
        data: message.content,
        cost: price,
        retries: 0,
      };
    } catch (error) {
      console.log('#DBG#', 'OPENAI ERROR', error);

      // @TODO: Handle error cost
      return {
        type: 'error',
        error,
        cost: 0,
        retries: 0,
      };
    }
  }
}

function getUsageCost(usage: { prompt_tokens: number, completion_tokens: number, total_tokens: number }, model: string) {
  const prices = {
    'gpt-3.5-turbo': {
      prompt: 0.0015,
      completion: 0.002,
    },
    'gpt-4': {
      prompt: 0.03,
      completion: 0.06,
    },
  };

  const price = prices[model];

  return Math.round((price.prompt * (usage.prompt_tokens / 1000) + (price.completion * (usage.completion_tokens / 1000))) * 10000) / 10000;
}