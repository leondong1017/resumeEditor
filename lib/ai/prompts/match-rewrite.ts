import type { ParsedResume, JDAnalysis } from "@/lib/types";
import type { JDRewriteBrief } from "@/lib/ai/jd-rewrite-brief";
import { formatJdBriefForPrompt } from "@/lib/ai/jd-rewrite-brief";

export function matchRewritePrompt(
  parsedResume: ParsedResume,
  jdAnalysis: JDAnalysis,
  framework: "star" | "pdca",
  language: "zh" | "en"
) {
  const lang = language === "zh" ? "Chinese" : "English";
  const frameworkGuide =
    framework === "star"
      ? `STAR format:
- Situation: Brief context of the challenge or environment
- Task: Your specific responsibility or objective
- Action: Concrete steps you took (use strong action verbs)
- Result: Quantified outcomes and impact`
      : `PDCA format:
- Plan: The goal and strategy you devised
- Do: The specific actions and implementation
- Check: How you measured and evaluated results
- Act: Improvements made and lessons applied`;

  return `You are an expert resume writer specializing in the ${language === "zh" ? "Chinese" : "international"} job market.

Your task: Rewrite the candidate's experiences to better match the target job description, using the ${framework.toUpperCase()} framework.

## Target Role
Company: ${jdAnalysis.companyName}
Role: ${jdAnalysis.roleName}
Required Skills: ${jdAnalysis.requiredSkills.join(", ")}
Key Responsibilities: ${jdAnalysis.responsibilities.join("; ")}
Keywords: ${jdAnalysis.keywords.join(", ")}

## ${frameworkGuide}

## Rules
1. **NO FABRICATION**: Every rewritten experience MUST be based on the candidate's actual experience. The originalExperience field must contain the source text verbatim.
2. Write in ${lang}.
3. Use strong action verbs and quantified results where the original data supports it.
4. Naturally integrate relevant keywords from the JD — do not keyword-stuff.
5. Each experience's description MUST contain 3-4 concrete bullet points with real work details. Start each bullet with "• ".
6. **NEVER output placeholder text** like "基于STAR框架重构的工作经历" or "STAR formatted description". The description field must contain the actual rewritten content.
7. **NEVER include framework labels** like 【Situation】【Task】【Action】【Result】or【Plan】【Do】【Check】【Act】in the output. The ${framework.toUpperCase()} framework guides your thinking structure, but the final text must read as natural, professional bullet points without any bracketed labels.
8. **Plain text only**: Do NOT use Markdown (no **bold**, _italic_, \`code\`, or # headings) in any description field. The resume is rendered as plain text; asterisks would show literally.
9. Match the skill requirements and highlight relevant achievements.
10. Score each experience for relevance to the JD (0-100).

## Output Example for description field
Good: "• 负责公司核心交易系统的架构升级，原系统面临日均百万级订单的高并发瓶颈\n• 主导系统重构方案设计，采用微服务架构拆分单体应用，引入消息队列实现异步处理\n• 优化关键路径的数据库查询与缓存策略，降低P99延迟至50ms以内\n• 系统QPS从5000提升至18000，可用性达99.99%，支撑业务量增长3倍"
Bad: "• 【Situation】负责公司核心交易系统..." (framework labels should NOT appear in output)
Bad: "基于STAR框架重构的工作经历" (this is a placeholder, NOT actual content)

## Candidate's Parsed Resume
${JSON.stringify(parsedResume, null, 2)}`;
}

export function matchAnalysisPrompt(
  parsedResume: ParsedResume,
  jdAnalysis: JDAnalysis,
  language: "zh" | "en"
) {
  const lang = language === "zh" ? "Chinese" : "English";

  return `You are an expert career advisor. Analyze the match between the candidate and the target role. Write in ${lang}.

## Target Role
Company: ${jdAnalysis.companyName}
Role: ${jdAnalysis.roleName}
Required Skills: ${jdAnalysis.requiredSkills.join(", ")}
Preferred Skills: ${jdAnalysis.preferredSkills.join(", ")}
Key Responsibilities: ${jdAnalysis.responsibilities.join("; ")}
Keywords: ${jdAnalysis.keywords.join(", ")}

## Candidate's Resume
${JSON.stringify(parsedResume, null, 2)}

Score the overall match (0-100), list matched skills and gap skills, and map each major JD requirement to the most relevant candidate experience.`;
}

export function rewriteSingleItemPrompt(
  item: Record<string, unknown>,
  jdBrief: JDRewriteBrief,
  framework: "star" | "pdca",
  language: "zh" | "en",
  type: "work" | "project",
  options?: { matchHints?: string; reviewFeedback?: string }
) {
  const lang = language === "zh" ? "Chinese" : "English";
  const frameworkName = framework.toUpperCase();
  const briefBlock = formatJdBriefForPrompt(jdBrief);
  const hintsBlock = options?.matchHints
    ? `\n## JD-to-experience alignment (from match analysis)\n${options.matchHints}\n`
    : "";
  const retryBlock = options?.reviewFeedback
    ? `\n## Previous attempt failed review\n${options.reviewFeedback}\n`
    : "";

  return `You are an expert resume writer for the ${language === "zh" ? "Chinese" : "international"} job market.

Rewrite the following ${type === "work" ? "work experience" : "project experience"} to better match the target role. Use the ${frameworkName} framework as your internal thinking structure.

## Target Role
${briefBlock}
${hintsBlock}## Original Experience to Rewrite
${JSON.stringify(item, null, 2)}
${retryBlock}
## Rules (aligned with review criteria)
1. **不编造 (Fabrication Check)**: Every point must trace back to the original experience. No invented projects, metrics, or responsibilities. Copy originalExperience verbatim.
2. **量化 (Quantification)**: Include specific numbers, percentages, scale, or timeframes wherever the original data supports it. E.g., "QPS 提升 3 倍" not "显著提升性能".
3. **关键词覆盖 (Keyword Coverage)**: Naturally weave in required skills from the brief. Do NOT keyword-stuff — integrate them as genuine work context.
4. **语言精练 (Language Quality)**: Write in ${lang}. Strong action verbs. No vague filler like "参与了" or "协助完成". Each bullet must be substantive.
5. **格式一致 (Consistency)**: Description field MUST contain exactly 3-4 bullet points. Each starts with "• ". Maintain consistent tone and detail level across all items.
6. **框架遵循 (Framework Adherence)**: Use ${frameworkName} framework internally to structure thinking, but NEVER output labels like 【Situation】【Task】【Action】【Result】 or 【Plan】【Do】【Check】【Act】. The output reads as natural, professional prose.
7. **NEVER output placeholder text** like "STAR formatted description" or "基于框架重构的工作经历".
8. **纯文本**: 不要使用 Markdown（禁止 **加粗**、_斜体_、\`代码\` 等）；简历按纯文本展示，星号会原样出现。`;
}

/** Lightweight edit when fabrication is OK but required-skill coverage is low (saves a full rewrite). */
export function narrowKeywordPatchPrompt(
  originalExperience: string,
  currentDescription: string,
  missingKeywords: string[],
  jdBrief: JDRewriteBrief,
  language: "zh" | "en"
) {
  const lang = language === "zh" ? "Chinese" : "English";
  const brief = formatJdBriefForPrompt(jdBrief);
  return `You edit resume bullets. The text is factually grounded but should better reflect these required skills (still supported by the original): ${missingKeywords.join(", ")}.

## Target role (context)
${brief}

## Original — do not invent facts beyond this
${originalExperience}

## Current description — revise in place
${currentDescription}

## Rules
- Write in ${lang}.
- Keep exactly 3-4 lines, each starting with "• ".
- Do NOT add new projects, tools, or metrics not implied by the original.
- Naturally weave the missing skills into existing bullets.
- Plain text only: no Markdown ** or _ in output.`;
}
