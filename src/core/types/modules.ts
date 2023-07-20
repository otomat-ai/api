import { GeneratorFlowOption, GeneratorFlowProcessOption } from "@/interfaces/generators.interface";
import { AnalysisModule } from "../modules/analysis";
import { ClairModule } from "../modules/clair";
import { ComplianceModule } from "../modules/compliance";
import { Module, ModuleName, ModuleOptionDefinition, modules } from "otomat-types-ts";

export type ModuleOperator = {
  operator: typeof ClairModule;
}

export type OperatingModule<T extends Record<string, ModuleOptionDefinition<any>>> = Module<T> & ModuleOperator;

export type OperatingModules = {
  [Key in ModuleName]: OperatingModule<any>;
};

export const operatingModules: OperatingModules = {
  analysis: {
    type: 'pre',
    name: "Analysis",
    key: "analysis",
    description: "Retrieve AI analysis of your command and response",
    information: "Summarizes the understanding by the AI of the command for further analysis",
    operator: AnalysisModule,
    options: {},
  },
  compliance: {
    type: 'post',
    name: "Compliance",
    key: "compliance",
    description: "Validate the response of a command against a JSON schema",
    information: "Ensuring that your response is valid JSON and that it contains the expected properties",
    operator: ComplianceModule,
    options: {
      retry: {
        default: true as boolean, // TODO: Remove "as type" necessity
        required: false,
        description: 'Whether to retry the command if the response is invalid',
      },
    },
  },
} as const satisfies OperatingModules;

export type ModuleOption = {
  key: keyof typeof operatingModules;
  options?: Record<string, any>;
}

export function isPreModuleOption(option: GeneratorFlowOption): option is GeneratorFlowProcessOption {
  return option.type === 'process' && operatingModules[option.module.name].type === 'pre';
}

export function isPostModuleOption(option: GeneratorFlowOption): option is GeneratorFlowProcessOption {
  return option.type === 'process' && operatingModules[option.module.name].type === 'post';
}

export function isModuleOption(option: GeneratorFlowOption): option is GeneratorFlowProcessOption {
  return option.type === 'process';
}
