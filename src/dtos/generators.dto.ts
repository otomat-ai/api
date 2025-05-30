import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsBoolean, IsObject, IsArray } from 'class-validator';
import {
  GENERATOR_MODELS,
  Generator,
  GeneratorEndpointFunction,
  GeneratorExample,
  GeneratorExternalFunction,
  GeneratorFlowGenerateOption,
  GeneratorFlowProcessOption,
  GeneratorFunction,
  GeneratorFunctionArgument,
  GeneratorInstructions,
  GeneratorModel,
  GeneratorModule,
  GeneratorOption,
  GeneratorOutput,
  GeneratorSettings,
} from '@/interfaces/generators.interface';
import { operatingModules } from '@/core/types/modules';
import { ChatCompletionRequestMessage } from 'openai';

export class GeneratorSettingsDto implements GeneratorSettings {
  @IsString()
  @IsIn(['default', 'full'])
  public context: 'default' | 'full';

  @IsOptional()
  public retries?: number;

  @IsString()
  @IsIn(GENERATOR_MODELS)
  @IsOptional()
  public model?: GeneratorModel;

  @IsString()
  @IsNotEmpty()
  public apiKey: string;

  @IsBoolean()
  @IsOptional()
  public example?: boolean;

  @IsBoolean()
  @IsOptional()
  public stream?: boolean;
}

export class GeneratorFlowGenerateOptionDto implements GeneratorFlowGenerateOption {
  @IsString()
  @IsIn(['generate'])
  public type: 'generate';
}

export class GeneratorModuleDto implements GeneratorModule<any> {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.keys(operatingModules))
  public name: keyof typeof operatingModules;

  @IsOptional()
  public options?: Record<string, any>;

  @IsOptional()
  public inputReference?: any;

  @IsOptional()
  public outputReference?: any;
}

export class GeneratorFlowProcessOptionDto implements GeneratorFlowProcessOption {
  @IsString()
  @IsIn(['process'])
  public type: 'process';

  @ValidateNested()
  public module: GeneratorModuleDto;
}

export class GeneratorOptionDto implements GeneratorOption {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsString()
  @IsIn(['string', 'number', 'boolean', 'object', 'array'])
  public type: 'string' | 'number' | 'boolean' | 'object' | 'array';

  @IsBoolean()
  public constant: boolean;

  @IsOptional()
  public default?: any;
}

export class GeneratorExampleDto implements GeneratorExample {
  @IsString()
  @IsNotEmpty()
  public input: string;

  @IsString()
  @IsNotEmpty()
  public output: string;
}

export class GeneratorOutputDto implements GeneratorOutput {
  @IsString()
  @IsOptional()
  public description?: string;

  @IsNotEmpty()
  public schema: any;
}

export class GeneratorEndpointFunctionDto implements GeneratorEndpointFunction {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @ValidateNested()
  public arguments: GeneratorFunctionArgumentDto[];

  @IsBoolean()
  public chain: boolean;

  @IsString()
  @IsIn(['endpoint'])
  public type: 'endpoint';

  @IsString()
  @IsNotEmpty()
  public url: string;

  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  public method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  @IsString()
  @IsIn(['query', 'body'])
  public payload: 'query' | 'body';

  @IsObject()
  @IsOptional()
  public headers?: Record<string, string>;
}

export class GeneratorExternalFunctionDto implements GeneratorExternalFunction {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @ValidateNested()
  public arguments: GeneratorFunctionArgumentDto[];

  @IsBoolean()
  public chain: boolean;

  @IsString()
  @IsIn(['external'])
  public type: 'external';
}

export class GeneratorFunctionArgumentDto implements GeneratorFunctionArgument {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsString()
  @IsIn(['string', 'number', 'boolean', 'object', 'array'])
  public type: 'string' | 'number' | 'boolean' | 'object' | 'array';

  @IsBoolean()
  public required: boolean;

  @IsOptional()
  default?: any;
}

export class GeneratorInstructionsDto implements GeneratorInstructions {
  @IsString()
  @IsNotEmpty()
  public prompt: string;

  @IsString()
  @IsOptional()
  public context?: string;

  @IsString()
  @IsOptional()
  public information?: string;

  @ValidateNested()
  @IsOptional()
  public examples?: GeneratorExampleDto[];

  @ValidateNested()
  @IsOptional()
  public options?: GeneratorOptionDto[];

  @ValidateNested()
  public output: GeneratorOutputDto | GeneratorOutputDto[];

  @ValidateNested()
  @IsOptional()
  public functions?: (GeneratorEndpointFunctionDto | GeneratorExternalFunctionDto)[];
}

export class GeneratorDto implements Generator {
  @ValidateNested()
  public instructions: GeneratorInstructionsDto;

  @ValidateNested()
  public settings: GeneratorSettingsDto;

  @ValidateNested()
  @IsOptional()
  public flow?: (GeneratorFlowGenerateOptionDto | GeneratorFlowProcessOptionDto)[];

  @IsNotEmpty()
  public data: any;

  @IsOptional()
  public options?: Record<string, any>;

  @IsOptional()
  public history?: ChatCompletionRequestMessage[];
}
