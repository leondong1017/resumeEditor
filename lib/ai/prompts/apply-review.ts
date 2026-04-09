import type { Resume } from "@/lib/types";

export function applyReviewPrompt(resume: Resume) {
  const lang = resume.meta.language === "zh" ? "Chinese" : "English";
  const fw = resume.meta.framework.toUpperCase();
  const feedback = resume.analysis.reviewFeedback;
  if (!feedback) {
    return "No review feedback.";
  }

  return `You are an expert resume editor. Revise the candidate's resume OUTPUT so it fully addresses the quality review feedback below.

## Hard rules
- Return the COMPLETE resume output object (all fields). Use the current output as the base; change only what is needed to fix issues.
- **originalExperience** on every work and project entry MUST stay **byte-for-byte identical** to the input — never invent or alter traceability text.
- Do not fabricate employers, dates, metrics, or achievements that are not supported by the corresponding originalExperience (or obvious factual fields like company name).
- Write in ${lang}. Align experience descriptions with the ${fw} framework where applicable.
- Do not use Markdown formatting (**bold**, etc.) in any output field; plain text only for resume rendering.
- If review suggests replacement text for a bullet, prefer adapting that suggestion while staying truthful to originalExperience.
- Preserve basicInfo.name and factual identity fields unless the review explicitly flags an error there.
- summary and threeLineIntro: revise if the review comments on them; otherwise keep meaning and improve wording only when review asks.

## Current resume output
${JSON.stringify(resume.output, null, 2)}

## Quality review feedback
overallAssessment: ${JSON.stringify(feedback.overallAssessment)}

items:
${JSON.stringify(feedback.items, null, 2)}
`;
}
