export function analyzeJDPrompt(language: "zh" | "en") {
  const lang = language === "zh" ? "Chinese" : "English";
  return `You are a job description analyst. Analyze the following job description and extract structured information.
The JD is in ${lang}.

Rules:
- Identify the company name and role name
- Separate required skills from preferred/nice-to-have skills
- Extract key responsibilities
- Identify important keywords for resume optimization
- Determine the seniority level (entry/mid/senior/lead/director)
- Be thorough in extracting keywords that would be important for ATS matching`;
}
