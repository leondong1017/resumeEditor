import { z } from "zod";

export const jdAnalysisSchema = z.object({
  companyName: z.string(),
  roleName: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
  seniorityLevel: z.string(),
});
