import { ClairModule } from "./clair";
import { PostOperatorData, PostOperatorResult } from "../operator";
import fetch from "node-fetch";
import { GeneratorModule } from "@/interfaces/generators.interface";
import { ProcessInfo } from "@/controllers/generator.controller";

export const MODERATION_COST = 0.005;

export class ModerationModule extends ClairModule {
  static async _postOperate({ module, generator, completion, meta }: PostOperatorData & { module: GeneratorModule }): Promise<{ data: PostOperatorResult, result: ProcessInfo }> {
    if (completion.type === 'function') {
      return {
        data: { success: true, cost: 0, generator, meta, completion },
        result: { status: 'success', module: module.name, cost: 0, retries: 0 },
      };
    }

    const moderated = await fetch(
      `https://moderationapi.com/api/v1/moderation/text?value=${encodeURIComponent(
        completion.data
      )}`,
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MmQzMjQ5YTczMzYxZjE5YmNkMTM2NyIsInVzZXJJZCI6IjY0MmQzMjE2YTczMzYxZjE5YmNkMTM2NCIsImlhdCI6MTY4MDY4MzU5M30.OwGCxFcwPlKcr_cThkvIx-a0gWTU2WzySCGgS3mz5Dg`,
        },
      }
    );

    const { status, flagged, toxicity } = (await moderated.json()) as any;
    if (status !== "success") {
      return {
        data: { success: false, retry: true, meta, error: this.formatError("Moderation API error") },
        result: { status: 'failed', error: this.formatError("Moderation API error"), module: module.name, cost: 0, retries: 0 },
      };
    }
    if (flagged) {
      return {
        data: { success: false, retry: true, meta, error: this.formatError("Message flagged: " + toxicity.label) },
        result: { status: 'failed', error: this.formatError("Message flagged: " + toxicity.label), module: module.name, cost: 0, retries: 0 },
      };
    }

    return {
      data: { success: true, cost: 0, generator, meta, completion },
      result: { status: 'success', module: module.name, cost: 0, retries: 0 },
    };
  }
};