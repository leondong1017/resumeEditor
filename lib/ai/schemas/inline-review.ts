import { z } from "zod";

export const inlineReviewSchema = z.object({
  passed: z.boolean().describe("Whether the rewrite passes both fabrication and keyword checks"),
  fabricationOk: z.boolean().describe("True if all content traces back to the original experience"),
  keywordCoverage: z.array(z.string()).describe("JD required skills that are naturally covered in the rewrite"),
  missingKeywords: z.array(z.string()).describe("JD required skills not covered"),
  message: z.string().describe("Brief explanation if not passed, empty string if passed"),
});
