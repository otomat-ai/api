import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsBoolean } from 'class-validator';
import { Generator, GeneratorExample, GeneratorFlowGenerateOption, GeneratorFlowProcessOption, GeneratorFunction, GeneratorFunctionArgument, GeneratorInstructions, GeneratorModule, GeneratorOption, GeneratorOutput, GeneratorSettings } from '@/interfaces/generators.interface';
import { modules } from '@/core/types/modules';

/**
 * @TODO: Custom Flow Validation (pre - generate - post)
 */

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
}

export class GeneratorInstructionsDto implements GeneratorInstructions {
  @IsString()
  @IsNotEmpty()
  public prompt: string;

  @IsString()
  @IsOptional()
  public context?: string;

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
  public functions?: GeneratorFunctionDto[];
}

export class GeneratorSettingsDto implements GeneratorSettings {
  @IsString()
  @IsIn(['default', 'full'])
  public context: 'default' | 'full';

  @IsString()
  @IsIn(['gpt-3.5-turbo', 'gpt-4'])
  @IsOptional()
  public model?: 'gpt-3.5-turbo' | 'gpt-4';

  @IsString()
  @IsNotEmpty()
  public apiKey: string;
}

export class GeneratorFlowGenerateOptionDto implements GeneratorFlowGenerateOption {
  @IsString()
  @IsIn(['generate'])
  public type: 'generate';
}

export class GeneratorFlowProcessOptionDto implements GeneratorFlowProcessOption {
  @IsString()
  @IsIn(['process'])
  public type: 'process';

  @ValidateNested()
  public module: GeneratorModuleDto;
}

export class GeneratorModuleDto implements GeneratorModule {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.keys(modules))
  public name: keyof typeof modules;

  @IsOptional()
  public options?: Record<string, any>;

  @IsOptional()
  public inputReference?: any;

  @IsOptional()
  public outputReference?: any;
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

export class GeneratorFunctionDto implements GeneratorFunction {
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
  public required?: boolean;

  @IsOptional()
  default?: any;
}