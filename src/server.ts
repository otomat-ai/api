import { App } from '@/app';
import { ValidateEnv } from '@utils/validateEnv';
import { GeneratorRoute } from './routes/generator.route';

ValidateEnv();

const app = new App([new GeneratorRoute()]);

app.listen();
