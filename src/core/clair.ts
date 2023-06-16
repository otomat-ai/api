import { Generator, GeneratorFunction, GeneratorFunctionArgument, GeneratorInstructions, GeneratorOption } from "@/interfaces/generators.interface";
import { ChatCompletionFunctions, ChatCompletionRequestMessage } from "openai";

export type AIContext = {
  description: string;
  instructions: string;
}

export type AIContextData = {
  command: AICommand;
  response: AIResponse;
  options: AIOptions<any>;
}

export type AIOptions<T> = Record<string, T>;

export type AICommand = {
  name: string;
  description: string;
  payload: string;
}

export type AIResponse = {
  name: string;
  data: string;
}

export type PromptPayload = {
  options: AIOptions<any>;
  data?: any;
}

export type AIFunction = ChatCompletionFunctions & { chain: boolean };

export type PromptResponse = {
  messages: ChatCompletionRequestMessage[];
  functions: AIFunction[];
};

export class Clair {

  public static generatePrompt({ instructions, data, options }: Generator): PromptResponse {
    const context = Clair.generateContext(instructions, options, instructions.options);
    const query = Clair.generateQuery(data);

    const functions = instructions.functions?.map((func) => Clair.generatorFunctionToJSON(func)) || [];

    return {
      messages: [
        ...context,
        query,
      ],
      functions,
    };
  }

  private static generateContext(instructions: GeneratorInstructions, options: Record<string, any>, generatorOptions: GeneratorOption[]): ChatCompletionRequestMessage[] {
    const promptExample = Clair.generateExample();
    const promptInstructions = Clair.generateInstructions(instructions, options, generatorOptions);

    return [ ...promptExample, ...promptInstructions ];
  }

  private static generateExample(): { role: 'system' | 'user' | 'assistant'; content: string }[] {
    return [
      {
        role: 'system',
        content: `
        CONTEXT:
          Find emails from potential customers, and generate a response to send to them
          We are a company that sells a marketing software

        CONSTRAINTS: The response must be either a Function Call or valid JSON complying with one of the Response schemas below

        RESPONSE FORMATS: [
          {
            schema: {
              "type": "object",
              "properties": {
                "is_potential_customer": {
                  "type": "boolean",
                  "description": "Whether the email is from a potential customer"
                },
                "response_mail": {
                  "type": "string",
                  "description": "The response to send by email, in case he is a potential customer"
                }
              },
              "required": [
                "is_potential_customer"
              ]
            }
          }
        ]

        OPTIONS:
        <language>: english
        The language of the response
        <tone>: formal
        The tone of the response`,
      },
      {
        role: 'user',
        content: `
        {
          "from_name": "John Doe",
          "email_body": "Hello Jack, thank you for contacting us. We just opened a ticket for you. We will get back to you as soon as possible. Best regards, John Doe"
        }`,
      },
      {
        role: 'assistant',
        content: `
        {
          "is_potential_customer": false
        }`,
      },
    ];
  }

  private static generateInstructions(instructions: GeneratorInstructions, options: Record<string, any>, generatorOptions: GeneratorOption[]): ChatCompletionRequestMessage[] {
    const prompt = instructions.prompt;
    const context = instructions.context || [];

    return [
      {
        role: 'system',
        content: `
        CONTEXT:
          ${prompt}
          ${context}

        CONSTRAINTS: The response must be either a Function Call or valid JSON complying with one of the Response schemas below

        RESPONSE FORMATS: ${JSON.stringify(instructions.output)}

        OPTIONS: ${this.generateOptionsInstructions(generatorOptions, options)}`,
      },
    ];
  }

  private static generateOptionsInstructions(generatorOptions: GeneratorOption[], options: Record<string, any>): string {
    const generatorFunctionsMap = new Map<string, GeneratorOption>();
    generatorOptions.forEach((option) => generatorFunctionsMap.set(option.name, option));

    let useOptions = { ...options };

    generatorOptions.forEach((option) => {
      if (option.constant) {
        useOptions[option.name] = option.default;
      }
    });

    if (!useOptions || Object.keys(useOptions).length === 0) {
      return '';
    }

    return `
    ${Object.entries(useOptions).map(([name, value]) => {
      const generatorOption = generatorFunctionsMap.get(name);
      return `
      <${name.toLowerCase()}> ${value}
      ${generatorOption.description}
      `}).join('')}
    `;
  }

  private static generateQuery(data: any): { role: 'user'; content: string } {
    const { _context, ...dataWithoutContext } = data || {};

    return {
      role: 'user',
      content: JSON.stringify(dataWithoutContext),
    };
  }

  private static generatorFunctionToJSON(func: GeneratorFunction): AIFunction {
    const parameters: any = {
        type: 'object',
        properties: {},
        required: [],
        default: {}
    };

    func.arguments.forEach((arg: GeneratorFunctionArgument) => {
        let propertyType: any;
        if (arg.type === 'array') {
            propertyType = { type: 'array' };
        } else if (arg.type === 'object') {
            propertyType = { type: 'object' };
        } else {
            propertyType = { type: arg.type };
        }

        parameters.properties[arg.name] = propertyType;

        if (arg.description) {
            propertyType.description = arg.description;
        }

        if (arg.default) {
            propertyType.default = arg.default;
        }

        if (arg.required) {
            parameters.required.push(arg.name);
        }
    });

    return {
        name: func.name,
        description: func.description,
        parameters,
        chain: func.chain,
    };
  }
}