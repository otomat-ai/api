import { PostOperatorData, PostOperatorResult, PreOperatorData, PreOperatorResult } from "../operator";

export class ClairModule {
  static async operate(data: PreOperatorData | PostOperatorData): Promise<PreOperatorResult | PostOperatorResult> {
    throw new Error("Method not implemented.");
  }

  static formatError(message: string): string {
    return `${this.name} - ${message}`;
  }
}