import { JDAnalysis, MatchResult, WorkExperience } from "@/lib/types";

export function genIntroPrompt(
  jdAnalysis: JDAnalysis,
  matchResult: MatchResult,
  experiences: WorkExperience[],
  language: "zh" | "en"
) {
  const lang = language === "zh" ? "Chinese" : "English";
  return `You are a professional resume writer. Write a three-line professional intro suitable for recruitment app bios (e.g., Boss直聘, 拉勾).

## Target Role
Company: ${jdAnalysis.companyName}
Role: ${jdAnalysis.roleName}

## Match Analysis
Overall Score: ${matchResult.overallScore}/100
Matched Skills: ${matchResult.matchedSkills.join(", ")}

## Recent Experience
${experiences
  .slice(0, 3)
  .map((e) => `${e.company} - ${e.title}`)
  .join("\n")}

## Rules
- Write in ${lang}
- Exactly 3 lines, each line is a self-contained statement
- Line 1: Current role/identity + years of experience
- Line 2: Key expertise areas and notable achievements
- Line 3: What you're looking for / career goal aligned with the target role
- Keep each line under 50 characters (${language === "zh" ? "25 Chinese characters" : "50 English characters"})
- Separate the three lines with newlines`;
}
