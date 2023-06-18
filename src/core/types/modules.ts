import { GeneratorFlowOption, GeneratorFlowProcessOption, GeneratorModule, GeneratorPostModule, GeneratorPreModule } from "@/interfaces/generators.interface";
import { AnalysisModule } from "../modules/analysis";
import { ClairModule } from "../modules/clair";
import { ComplianceModule } from "../modules/compliance";

export type ModuleNames = keyof typeof modules;

export type ModuleOptionDefinition<T extends string | number | boolean> = {
  default: T;
  required: boolean;
  description: string;
}

export type ModuleOptionValue<T extends ModuleNames> = {
  [K in keyof typeof modules[T]['options']]?: typeof modules[T]['options'][K] extends ModuleOptionDefinition<infer R> ? R : never;
};

export type Module<T extends Record<string, ModuleOptionDefinition<any>>> = {
  name: string;
  key: string;
  description: string;
  information?: string;
  operator: typeof ClairModule;
  options: T;
}

export const postModules = {
  compliance: {
    name: "Compliance",
    key: "compliance",
    description: "Validate the response of a command against a JSON schema",
    information: "Ensuring that your response is valid JSON and that it contains the expected properties",
    operator: ComplianceModule,
    options: {
      retry: {
        default: true as boolean, // TODO: Remove "as type" necessity
        required: false,
        description: "Whether to retry the command if the response is invalid",
      },
    },
  },
} as const satisfies Record<string, Module<Record<string, ModuleOptionDefinition<any>>>>;

export const preModules = {
  analysis: {
    name: "Analysis",
    key: "analysis",
    description: "Retrieve AI analysis of your command and response",
    information: "Summarizes the understanding by the AI of the command for further analysis",
    operator: AnalysisModule,
    options: {}
  },
} as const satisfies Record<string, Module<Record<string, ModuleOptionDefinition<any>>>>;

export const modules = {
  ...postModules,
  ...preModules,
} as const satisfies Record<string, Module<Record<string, ModuleOptionDefinition<any>>>>;

export type ModuleOption = {
  key: keyof typeof modules;
  options?: Record<string, any>;
}

export type PreModuleOption = {
  key: keyof typeof preModules;
  options?: Record<string, any>;
}

export type PostModuleOption = {
  key: keyof typeof postModules;
  options?: Record<string, any>;
}

export function isPreModuleOption(option: GeneratorFlowOption): option is GeneratorFlowProcessOption {
  return option.type === 'process' && option.module.name in preModules;
}

export function isPostModuleOption(option: GeneratorFlowOption): option is GeneratorFlowProcessOption {
  return option.type === 'process' && option.module.name in postModules;
}

export function isModuleOption(option: GeneratorFlowOption): option is GeneratorFlowProcessOption {
  return option.type === 'process' && option.module.name in modules;
}
