import { ClairModule } from "./clair";
import { PostOperatorData, PostOperatorResult } from "../operator";
import { GeneratorModule } from "@/interfaces/generators.interface";
import { ProcessInfo } from "@/controllers/generator.controller";

export const CARBON_COST = 0.001;

export class CarbonModule extends ClairModule {
  static async _postOperate({ module, generator, completion, meta }: PostOperatorData & { module: GeneratorModule }): Promise<{ data: PostOperatorResult, result: ProcessInfo }> {
    const newMeta = {
      ...meta,
      cost: meta.cost + CARBON_COST,
    };

    return {
      data: { success: true, cost: 0, generator, completion, meta: newMeta },
      result: { status: 'success', module: module.name, cost: 0, retries: 0 },
    };
  }
}