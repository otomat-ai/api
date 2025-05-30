import { Clair } from '@/core/clair';
import { Generator, GeneratorModel } from '@/interfaces/generators.interface';
import { ChatCompletionFunctions, ChatCompletionRequestMessageFunctionCall, Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { Service } from 'typedi';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';

type BaseCompletion = {
  cost: number;
  retries: number;
};

type JSONCompletion = BaseCompletion & {
  type: 'json';
  data: any;
};

type FunctionCompletion = BaseCompletion & {
  type: 'function';
  function: ChatCompletionFunctions;
  chain: boolean;
  data: ChatCompletionRequestMessageFunctionCall;
};

// type CompletionErrorType = 'invalid_function' | 'invalid_json' | 'invalid_model' | 'token_limit_reached' | 'unknown_error';

type ErrorCompletion = BaseCompletion & {
  type: 'error';
  error: any;
  // error: CompletionErrorType,
};

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
    const configuration = new Configuration({ apiKey });
    return new OpenAIApi(configuration);
  }

  async listModels(apiKey: string) {
    const response = await OpenAiService.getClient(apiKey).listModels();
    return response.data;
  }

  async getCompletion(generator: Generator, streamCallback?: (token: string) => void): Promise<Completion> {
    const apiKey = generator.settings.apiKey;
    if (!apiKey) throw new Error('No OpenAI API key provided');

    const availableModels = (await this.listModels(apiKey)).data.map(m => m.id);
    const defaultModel = 'gpt-4.1-nano';

    const model = generator.settings.model || defaultModel;

    if (!availableModels.includes(model)) {
      throw new Error(`Model ${model} is not available for this OpenAI API key.`);
    }

    const { messages, functions } = Clair.generatePrompt(generator);

    const functionsParam = functions.length > 0 ? { functions } : {};

    const request: CreateChatCompletionRequest = {
      model,
      messages,
      ...functionsParam,
    };

    console.log('#DBG#', 'OPENAI REQUEST', request);

    if (generator.settings.stream === true) {
      const chat = new ChatOpenAI({
        modelName: model,
        openAIApiKey: apiKey,
        streaming: true,
      });

      const response = await chat.call(
        request.messages.map(message => {
          if (message.role === 'user') {
            return new HumanMessage(message.content);
          }
          if (message.role === 'system') {
            return new SystemMessage(message.content);
          }
          if (message.role === 'assistant') {
            return new AIMessage(message.content);
          }

          throw new Error(`Unknown message role ${message.role}`);
        }),
        {
          callbacks: [
            {
              handleLLMNewToken(token: string) {
                streamCallback?.(token);
              },
            },
          ],
        },
      );

      return;
    } else {
      try {
        const response = await OpenAiService.getClient(apiKey).createChatCompletion(request);
        console.log('#DBG#', 'OPENAI RESPONSE', response.data);

        const message = response.data.choices[0].message;
        console.log('#DBG#', 'OPENAI MESSAGE', message);

        const usage = response.data.usage;
        const price = getUsageCost(usage, generator.settings.model);
        console.log('#DBG#', 'OPENAI USAGE', usage, 'PRICE', price);

        if (message.function_call) {
          const functionCalled = functions.find(f => f.name === message.function_call.name);

          return {
            type: 'function',
            function: functionCalled,
            data: message.function_call,
            chain: functionCalled.chain,
            cost: price,
            retries: 0,
          };
        }

        return {
          type: 'json',
          data: message.content,
          cost: price,
          retries: 0,
        };
      } catch (error) {
        console.log('#DBG#', 'OPENAI ERROR', error.response?.data);

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
}

function getUsageCost(usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }, model: GeneratorModel) {
  const prices: Record<GeneratorModel, { prompt: number; completion: number }> = {
    'gpt-3.5-turbo': {
      prompt: 0.0015,
      completion: 0.002,
    },
    'gpt-3.5-turbo-16k': {
      prompt: 0.003,
      completion: 0.004,
    },
    'gpt-4': {
      prompt: 0.03,
      completion: 0.06,
    },
    'gpt-4-32k': {
      prompt: 0.06,
      completion: 0.12,
    },
    'gpt-4.1': {
      prompt: 0.002,
      completion: 0.008,
    },
    'gpt-4.1-mini': {
      prompt: 0.0004,
      completion: 0.0016,
    },
    'gpt-4.1-nano': {
      prompt: 0.0001,
      completion: 0.0004,
    },
  };

  let price = prices[model];

  if (!price) {
    price = prices['gpt-4.1-nano']; // Default to gpt-4.1-nano if model is not found
  }

  return Math.round((price.prompt * (usage.prompt_tokens / 1000) + price.completion * (usage.completion_tokens / 1000)) * 10000) / 10000;
}
