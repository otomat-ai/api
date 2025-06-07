import { App } from './app';
import { GeneratorRoute } from './routes/generator.route';
import { ValidateEnv } from './utils/validateEnv';

export function startLegacyApi(port = 3046) {
  ValidateEnv();
  const app = new App([new GeneratorRoute()]);
  app.port = port;
  app.listen();
}
