import { ModuleNames, ModuleOptionDefinition, ModuleOptionValue, modules, postModules, preModules } from "@/core/types/modules";

export const GENERATOR_MODELS = ['gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo-16k', 'gpt-4-32k'] as const;

export type GeneratorModel = typeof GENERATOR_MODELS[number];

export type  GeneratorSettings = {
  context: 'default' | 'full';
  model?: GeneratorModel;
  retries?: number;
  apiKey: string;
}

export type GeneratorInstructions = {
  prompt: string;
  context?: string;
  examples?: GeneratorExample[];
  options?: GeneratorOption[];
  output: GeneratorOutput | GeneratorOutput[];
  functions?: GeneratorFunction[];
}

export type GeneratorExample = {
  input: string;
  output: string;
}

export type GeneratorModule<T extends ModuleNames> = {
  name: T;
  options?: ModuleOptionValue<T>;
  inputReference?: any;
  outputReference?: any;
}

export type GeneratorPreModule = {
  name: keyof typeof preModules;
  options?: Record<string, any>;
  inputReference?: any;
  outputReference?: any;
}

export type GeneratorPostModule = {
  name: keyof typeof postModules;
  options?: Record<string, any>;
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
  required?: boolean;
  default?: any;
}

export type GeneratorFunction = {
  name: string;
  description: string;
  arguments: GeneratorFunctionArgument[];
  operation: string;
  chain: boolean;
}

export interface Generator {
  instructions: GeneratorInstructions;
  settings: GeneratorSettings;
  flow?: GeneratorFlow;
  data: any;
  options?: Record<string, any>;
}