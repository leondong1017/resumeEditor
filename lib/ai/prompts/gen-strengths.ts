import { JDAnalysis, MatchResult } from "@/lib/types";

export function genStrengthsPrompt(
  jdAnalysis: JDAnalysis,
  matchResult: MatchResult,
  language: "zh" | "en"
) {
  const lang = language === "zh" ? "Chinese" : "English";
  return `You are a professional resume writer. Write a compelling professional summary for this candidate.

## Target Role
Company: ${jdAnalysis.companyName}
Role: ${jdAnalysis.roleName}
Seniority: ${jdAnalysis.seniorityLevel}

## Match Analysis
Overall Score: ${matchResult.overallScore}/100
Matched Skills: ${matchResult.matchedSkills.join(", ")}
Gap Skills: ${matchResult.gapSkills.join(", ")}

## Rules
- Write in ${lang}
- 3-5 sentences, concise and impactful
- Highlight matched skills and relevant experience
- Use confident but honest language
- Do not claim skills the candidate doesn't have
- Focus on value proposition for this specific role`;
}
