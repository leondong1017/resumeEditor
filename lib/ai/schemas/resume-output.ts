import { z } from "zod";
import { basicInfoSchema, educationSchema } from "@/lib/ai/schemas/resume";
import {
  projectExperienceSchema,
  workExperienceSchema,
} from "@/lib/ai/schemas/rewrite";

/** Full editor/PDF resume output — used by apply-review and must match `Resume["output"]`. */
export const resumeOutputSchema = z.object({
  basicInfo: basicInfoSchema,
  summary: z.string(),
  threeLineIntro: z.string(),
  experiences: z.array(workExperienceSchema),
  projects: z.array(projectExperienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  awards: z.array(z.string()),
});
