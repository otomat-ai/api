import { GeneratorFlowOption, GeneratorFlowProcessOption, GeneratorModule, GeneratorPostModule, GeneratorPreModule } from "@/interfaces/generators.interface";
import { AnalysisModule } from "../modules/analysis";
import { CARBON_COST, CarbonModule } from "../modules/carbon";
import { ClairModule } from "../modules/clair";
import { ComplianceModule } from "../modules/compliance";
import { MODERATION_COST, ModerationModule } from "../modules/moderation";

type BaseModule = {
  name: string;
  slug: string;
  description: string;
  information?: string;
  operator: typeof ClairModule;
  options?: Record<string, { type: 'string' | 'number' | 'boolean', default: any, required: boolean, description: string }>;
  creditCost: number;
  price: number;
  unit: ModuleUnit | null;
}

export type ModuleUnit = 'day' | 'week' | 'month' | 'year' | 'lifetime' | 'call';

export type FreeModule = BaseModule & {
  type: 'free';
}

export type ProModule = BaseModule & {
  type: 'pro';
  included: boolean;
}

export type InfiniteModule = BaseModule & {
  type: 'infinite';
  included: boolean;
}

export type Module = FreeModule | ProModule | InfiniteModule;

export const postModules = {
  compliance: {
    name: "Compliance",
    slug: "compliance",
    type: 'free',
    creditCost: 0,
    price: 0,
    unit: null,
    description: "Validate the response of a command against a JSON schema",
    information: "Ensuring that your response is valid JSON and that it contains the expected properties",
    operator: ComplianceModule,
  },
  moderation: {
    name: "Moderation",
    slug: "moderation",
    type: 'pro',
    creditCost: MODERATION_COST * 100,
    price: MODERATION_COST,
    unit: 'call',
    included: true,
    description: "Moderate the response of a command",
    information: "The data received will always be safe and appropriate for the user",
    operator: ModerationModule,
    options: {
      "profanity": {
        type: 'boolean',
        default: true,
        required: false,
        description: "Whether to filter out profanity",
      },
      "nsfw": {
        type: 'boolean',
        default: true,
        required: false,
        description: "Whether to filter out NSFW content",
      },
    },
  },
  carbon: {
    name: "Carbon",
    slug: "carbon",
    type: 'pro',
    creditCost: CARBON_COST * 100,
    price: CARBON_COST,
    unit: 'call',
    included: false,
    description: "Offset your carbon footprint",
    information: "Money spent on this module will be used to offset the carbon footprint of your usage",
    operator: CarbonModule,
  },
} as const satisfies Record<string, Module>;

export const preModules = {
  analysis: {
    name: "Analysis",
    slug: "analysis",
    type: 'pro',
    creditCost: -1,
    price: 5,
    unit: 'month',
    included: true,
    description: "Retrieve AI analysis of your command and response",
    information: "Summarizes the understanding by the AI of the command for further analysis",
    operator: AnalysisModule,
  },
} as const satisfies Record<string, Module>;

export const modules = {
  ...postModules,
  ...preModules,
} as const satisfies Record<string, Module>;

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