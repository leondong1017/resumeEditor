import { z } from "zod";

export const reviewItemSchema = z.object({
  section: z.string(),
  severity: z.enum(["error", "warning", "suggestion"]),
  message: z.string(),
  originalText: z.string().optional(),
  suggestedText: z.string().optional(),
});

export const reviewFeedbackSchema = z.object({
  items: z.array(reviewItemSchema),
  overallAssessment: z.string(),
});
