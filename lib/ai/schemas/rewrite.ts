import { z } from "zod";

export const workExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().describe("STAR/PDCA formatted description with bullet points"),
  originalExperience: z.string().describe("The original experience text this was rewritten from"),
});

export const projectExperienceSchema = z.object({
  name: z.string(),
  role: z.string(),
  period: z.string(),
  description: z.string().describe("STAR/PDCA formatted description with bullet points"),
  originalExperience: z.string().describe("The original experience text this was rewritten from"),
});

export const matchedExperienceSchema = z.object({
  jdRequirement: z.string(),
  userExperience: z.string(),
  relevanceScore: z.number().min(0).max(100),
});

export const rewriteResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  gapSkills: z.array(z.string()),
  matchedExperiences: z.array(matchedExperienceSchema),
  experiences: z.array(workExperienceSchema),
  projects: z.array(projectExperienceSchema),
});
