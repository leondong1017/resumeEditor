import { z } from "zod";

export const reviewItemSchema = z.object({
  section: z.string(),
  severity: z.enum(["error", "warning", "suggestion"]),
  message: z.string(),
  originalText: z.string().nullish(),
  suggestedText: z.string().nullish(),
});

export const reviewFeedbackSchema = z.object({
  items: z.array(reviewItemSchema),
  overallAssessment: z.string(),
});
