import { ClairModule } from "./clair";
import { PostOperatorData, PostOperatorResult } from "../operator";
import fetch from "node-fetch";

export const MODERATION_COST = 0.005;

export class ModerationModule extends ClairModule {
  static async operate({data}: PostOperatorData): Promise<PostOperatorResult> {
    const moderated = await fetch(
      `https://moderationapi.com/api/v1/moderation/text?value=${encodeURIComponent(
        data.result[0]
      )}`,
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MmQzMjQ5YTczMzYxZjE5YmNkMTM2NyIsInVzZXJJZCI6IjY0MmQzMjE2YTczMzYxZjE5YmNkMTM2NCIsImlhdCI6MTY4MDY4MzU5M30.OwGCxFcwPlKcr_cThkvIx-a0gWTU2WzySCGgS3mz5Dg`,
        },
      }
    );

    const moderationCost = data.cost + MODERATION_COST;

    const { status, flagged, toxicity } = (await moderated.json()) as any;
    if (status !== "success") {
      return { success: false, retry: true, error: this.formatError("Could not moderate") };
    }
    if (flagged) {
      return { success: false, retry: true, error: this.formatError("Message flagged: " + toxicity.label) };
    }

    return { success: true, creditCost: MODERATION_COST * 100, data: { ...data, cost: moderationCost } };
  }
};