import { z } from "zod";

export const strengthsSchema = z.object({
  summary: z.string().describe("Professional summary paragraph, 3-5 sentences"),
});
