import { z } from "zod";

export const basicInfoSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
});

export const parsedExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
});

export const parsedProjectSchema = z.object({
  name: z.string(),
  role: z.string(),
  period: z.string(),
  description: z.string(),
});

export const educationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  major: z.string(),
  period: z.string(),
  highlights: z.array(z.string()),
});

export const parsedResumeSchema = z.object({
  basicInfo: basicInfoSchema,
  experiences: z.array(parsedExperienceSchema),
  projects: z.array(parsedProjectSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  awards: z.array(z.string()),
});
