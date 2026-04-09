import type { Resume } from "@/lib/types";

const MIN_DESC_LEN = 15;

export interface PrecheckResult {
  ok: boolean;
  issues: string[];
}

/**
 * Local checks before calling the review model — traceability and non-empty high-risk blocks.
 */
export function runResumePrecheck(output: Resume["output"]): PrecheckResult {
  const issues: string[] = [];

  output.experiences.forEach((exp, i) => {
    const label = `工作经历 ${i + 1}（${exp.company || "未命名"}）`;
    if (!exp.originalExperience?.trim()) {
      issues.push(`${label}：缺少可追溯原文，无法与改写内容对照。`);
    }
    if (!exp.description?.trim() || exp.description.trim().length < MIN_DESC_LEN) {
      issues.push(`${label}：描述过短或为空，请先补充后再审核。`);
    }
  });

  output.projects.forEach((proj, i) => {
    const label = `项目经历 ${i + 1}（${proj.name || "未命名"}）`;
    if (!proj.originalExperience?.trim()) {
      issues.push(`${label}：缺少可追溯原文。`);
    }
    if (!proj.description?.trim() || proj.description.trim().length < MIN_DESC_LEN) {
      issues.push(`${label}：描述过短或为空，请先补充后再审核。`);
    }
  });

  return { ok: issues.length === 0, issues };
}
