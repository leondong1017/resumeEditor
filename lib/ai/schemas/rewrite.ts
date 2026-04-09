import { z } from "zod";

export const workExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().describe("The fully rewritten experience content. Must contain 3-4 concrete bullet points with actual work details, metrics, and achievements. Never output placeholder text like 'STAR formatted description'."),
  originalExperience: z.string().describe("Copy the original experience text verbatim from the parsed resume"),
});

export const projectExperienceSchema = z.object({
  name: z.string(),
  role: z.string(),
  period: z.string(),
  description: z.string().describe("The fully rewritten project content. Must contain 3-4 concrete bullet points with actual project details, metrics, and outcomes. Never output placeholder text."),
  originalExperience: z.string().describe("Copy the original project text verbatim from the parsed resume"),
});

export const matchedExperienceSchema = z.object({
  jdRequirement: z.string(),
  userExperience: z.string(),
  relevanceScore: z.number().min(0).max(100),
});

export const matchAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  gapSkills: z.array(z.string()),
  matchedExperiences: z.array(matchedExperienceSchema),
});

export const rewriteResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  gapSkills: z.array(z.string()),
  matchedExperiences: z.array(matchedExperienceSchema),
  experiences: z.array(workExperienceSchema),
  projects: z.array(projectExperienceSchema),
});

/** Inline keyword-only patch — must stay consistent with work/project description rules. */
export const narrowPatchDescriptionSchema = z.object({
  description: z.string(),
});
