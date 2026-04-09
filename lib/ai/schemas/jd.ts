import { z } from "zod";

const keywordGroupSchema = z.object({
  category: z.string().describe("Theme name, e.g. '核心产品能力', 'AI/技术能力', '工具链', '行业领域'"),
  keywords: z.array(z.string()).describe("Keywords sorted by importance to this role, most critical first"),
});

export const jdAnalysisSchema = z.object({
  companyName: z.string(),
  roleName: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
  seniorityLevel: z.string(),
  keywordGroups: z.array(keywordGroupSchema).describe("All JD keywords organized by theme, groups sorted by importance to the role (most critical group first). Each group's keywords also sorted by importance."),
});
