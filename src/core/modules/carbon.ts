import { ClairModule } from "./clair";
import { PostOperatorData, PostOperatorResult } from "../operator";

export const CARBON_COST = 0.001;

export class CarbonModule extends ClairModule {
  static async operate({data}: PostOperatorData): Promise<PostOperatorResult> {
    const carbonCost = data.cost + CARBON_COST;

    return { success: true, creditCost: CARBON_COST * 100, data: { ...data, cost: carbonCost } };
  }
}