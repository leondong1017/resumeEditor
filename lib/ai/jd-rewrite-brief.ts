import type { JDAnalysis } from "@/lib/types";

/** Compact JD slice for per-item rewrite/review prompts (saves tokens vs full `JDAnalysis`). */
export type JDRewriteBrief = {
  companyName: string;
  roleName: string;
  requiredSkills: string[];
  responsibilitySummaries: string[];
  keywordSample: string[];
};

const MAX_SKILLS = 24;
const MAX_RESPONSIBILITIES = 5;
const MAX_KEYWORDS = 15;

export function buildJdRewriteBrief(jd: JDAnalysis): JDRewriteBrief {
  return {
    companyName: jd.companyName,
    roleName: jd.roleName,
    requiredSkills: jd.requiredSkills.slice(0, MAX_SKILLS),
    responsibilitySummaries: jd.responsibilities.slice(0, MAX_RESPONSIBILITIES),
    keywordSample: jd.keywords.slice(0, MAX_KEYWORDS),
  };
}

export function formatJdBriefForPrompt(b: JDRewriteBrief): string {
  const resp = b.responsibilitySummaries
    .map((r, i) => `${i + 1}. ${r}`)
    .join("\n");
  return `Company: ${b.companyName}
Role: ${b.roleName}
Required skills: ${b.requiredSkills.join(", ")}
Key responsibilities (summary):
${resp || "(none)"}
Keywords to weave naturally: ${b.keywordSample.join(", ")}`;
}
