import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/httpException';
import { Draft07, JSONError } from 'json-schema-library';
import { Generator } from '@/interfaces/generators.interface';

/**
 * @name OptionsValidationMiddleware
 * @description Validates the options
 */
export const OptionsValidationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const generator: Generator = req.body;
  const options = generator.instructions.options || [];

  const optionsSchema = new Draft07(optionsJsonSchema);
  const errors = optionsSchema.validate(options);

  if (errors.length > 0) {
    const message = errors.map((error: JSONError) => error.message).join(', ');
    next(new HttpException(400, message));
  }

  next();
};

const optionsJsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['string', 'number', 'boolean', 'object', 'array'],
      },
      constant: {
        type: 'boolean',
      },
      default: {
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
          {
            type: 'boolean',
          },
          {
            type: 'object',
          },
          {
            type: 'array',
          },
        ],
      },
    },
    required: ['name', 'description', 'type', 'constant'],
  },
};
