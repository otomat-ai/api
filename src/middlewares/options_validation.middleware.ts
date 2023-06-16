import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/httpException';
import { Draft07, JSONError } from 'json-schema-library';

/**
 * @name OptionsValidationMiddleware
 * @description Validates the options
 */
export const OptionsValidationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const options = req.body?.options || [];
    const optionsSchema = new Draft07(optionsJsonSchema);
    const errors = optionsSchema.validate(options);

    if (errors.length > 0) {
        const message = errors.map((error: JSONError) => error.message).join(', ');
        next(new HttpException(400, message));
    }

    next();
};

const optionsJsonSchema = {
  "type": "array",
  "items": {
      "type": "object",
      "properties": {
          "name": {
              "type": "string"
          },
          "description": {
              "type": "string"
          },
          "required": {
              "type": "boolean"
          },
          "constant": {
              "type": "boolean"
          },
          "default": {
              "oneOf": [
                  {
                      "type": "string"
                  },
                  {
                      "type": "number"
                  },
                  {
                      "type": "boolean"
                  },
                  {
                      "type": "null"
                  }
              ]
          }
      },
      "required": [
          "name",
          "description",
          "required",
          "constant",
          "default"
      ]
  }
}