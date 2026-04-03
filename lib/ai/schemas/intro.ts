import { z } from "zod";

export const introSchema = z.object({
  threeLineIntro: z.string().describe("Three-line professional intro for recruitment app bios, separated by newlines"),
});
