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
- Be thorough in extracting keywords that would be important for ATS matching

## Keyword Grouping Rules (for keywordGroups field)
Organize ALL extracted keywords into 3-6 thematic groups. Critical rules:
1. **Group ordering**: Sort groups by importance to the role. The most critical capability group comes first.
2. **Keyword ordering within each group**: Sort keywords by importance. The most essential keyword in each group comes first.
3. **No duplicates**: Each keyword appears in exactly one group.
4. **Concise keywords**: Keep each keyword short (2-8 characters for ${lang}). Avoid full sentences.
5. **Typical group themes**: 核心产品能力, AI/技术能力, 工具链, 软性素质, 行业领域, etc. Adapt to the actual JD content.`;
}
