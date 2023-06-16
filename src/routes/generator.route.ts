import { Router } from 'express';
import { GeneratorDto } from '@/dtos/generators.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { OptionsValidationMiddleware } from '@/middlewares/options_validation.middleware';
import { GeneratorController } from '@/controllers/generator.controller';

export class GeneratorRoute implements Routes {
  public path = '/clair';
  public router = Router();
  public generator = new GeneratorController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/generate', ValidationMiddleware(GeneratorDto), OptionsValidationMiddleware, this.generator.generate);
  }
}
