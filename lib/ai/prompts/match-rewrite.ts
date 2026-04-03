import { ParsedResume, JDAnalysis } from "@/lib/types";

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
1. **NO FABRICATION**: Every rewritten experience MUST be based on the candidate's actual experience. The originalExperience field must contain the source text.
2. Write in ${lang}.
3. Use strong action verbs and quantified results where the original data supports it.
4. Naturally integrate relevant keywords from the JD — do not keyword-stuff.
5. Each experience should have 3-4 bullet points maximum.
6. Match the skill requirements and highlight relevant achievements.
7. Score each experience for relevance to the JD (0-100).

## Candidate's Parsed Resume
${JSON.stringify(parsedResume, null, 2)}`;
}
