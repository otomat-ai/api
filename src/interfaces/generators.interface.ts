import { ChatCompletionRequestMessage } from "openai";
import { ModuleName, ModuleOptionValue } from "otomat-types-ts";

export const GENERATOR_MODELS = ['gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo-16k', 'gpt-4-32k', 'gpt-4-1106-preview'] as const;

export type GeneratorModel = typeof GENERATOR_MODELS[number];

export type  GeneratorSettings = {
  context: 'default' | 'full';
  model?: GeneratorModel;
  retries?: number;
  apiKey: string;
  example?: boolean;
  stream?: boolean;
}

export type GeneratorInstructions = {
  prompt: string;
  context?: string;
  information?: string;
  examples?: GeneratorExample[];
  options?: GeneratorOption[];
  output: GeneratorOutput | GeneratorOutput[];
  functions?: GeneratorFunction[];
}

export type GeneratorExample = {
  input: string;
  output: string;
}

export type GeneratorModule<T extends ModuleName> = {
  name: T;
  options?: ModuleOptionValue<T>;
  inputReference?: any;
  outputReference?: any;
}

export type GeneratorFlowGenerateOption = {
  type: 'generate';
}

export type GeneratorFlowProcessOption = {
  type: 'process';
  module: GeneratorModule<any>;
}

export type GeneratorFlowOption = GeneratorFlowGenerateOption | GeneratorFlowProcessOption;

export type GeneratorFlow = GeneratorFlowOption[];

export type GeneratorOutput = {
  description?: string;
  schema: any;
}

export type GeneratorOption = {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  constant: boolean;
  default?: any;
}

export type GeneratorFunctionArgument = {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
}

export type BaseGeneratorFunction = {
  name: string;
  description: string;
  arguments: GeneratorFunctionArgument[];
  chain: boolean;
}

export type GeneratorEndpointFunction = BaseGeneratorFunction & {
  type: 'endpoint';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: 'query' | 'body';
  headers?: Record<string, string>;
}

export type GeneratorExternalFunction = BaseGeneratorFunction & {
  type: 'external';
}

export type GeneratorFunction = GeneratorEndpointFunction | GeneratorExternalFunction;

export interface Generator {
  instructions: GeneratorInstructions;
  settings: GeneratorSettings;
  flow?: GeneratorFlow;
  data: any;
  options?: Record<string, any>;
  history?: ChatCompletionRequestMessage[];
}