import type { JDRewriteBrief } from "@/lib/ai/jd-rewrite-brief";
import { formatJdBriefForPrompt } from "@/lib/ai/jd-rewrite-brief";

export function inlineReviewPrompt(
  originalExperience: string,
  rewrittenDescription: string,
  jdBrief: JDRewriteBrief,
  language: "zh" | "en"
) {
  const lang = language === "zh" ? "Chinese" : "English";
  const brief = formatJdBriefForPrompt(jdBrief);

  return `You are a resume quality gate checker. Evaluate this single rewritten experience against two criteria ONLY.

## Original Experience (verbatim)
${originalExperience}

## Rewritten Description
${rewrittenDescription}

## Target Role Requirements (compact)
${brief}

## Check Criteria

### 1. Fabrication Check
Compare the rewritten description with the original experience. Flag if:
- Any specific project, tool, responsibility, or achievement is invented (not in the original)
- Numbers/metrics are fabricated (original didn't mention them)
- The rewrite claims scope or impact beyond what the original supports

### 2. Keyword Coverage
Check which of the JD's required skills are naturally reflected in the rewritten description.
List covered skills and missing skills.

## Rules
- Write your analysis in ${lang}.
- Be strict on fabrication — if in doubt, mark fabricationOk: false.
- passed = true ONLY if fabricationOk is true AND at least half the required skills are covered.
- Keep message concise (1 sentence if passed, 2-3 sentences if not).`;
}
