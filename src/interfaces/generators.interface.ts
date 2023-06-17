import { modules, postModules, preModules } from "@/core/types/modules";

export type  GeneratorSettings = {
  context: 'default' | 'full';
  model?: 'gpt-3.5-turbo' | 'gpt-4';
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

export type GeneratorModule = {
  name: keyof typeof modules;
  options?: Record<string, any>;
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
  module: GeneratorModule;
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
  chain: boolean;
}

export interface Generator {
  instructions: GeneratorInstructions;
  settings: GeneratorSettings;
  flow?: GeneratorFlow;
  data: any;
  options?: Record<string, any>;
}