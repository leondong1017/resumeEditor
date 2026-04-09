import type { Resume } from "@/lib/types";

/** 模型常输出 Markdown 加粗 **词**，简历按纯文本展示会变成字面 ** */
export function stripMarkdownBoldMarkers(text: string): string {
  return text.replace(/\*\*/g, "");
}

export function stripMarkdownFromResumeOutput(
  output: Resume["output"]
): Resume["output"] {
  return {
    ...output,
    summary: stripMarkdownBoldMarkers(output.summary),
    threeLineIntro: stripMarkdownBoldMarkers(output.threeLineIntro),
    experiences: output.experiences.map((e) => ({
      ...e,
      description: stripMarkdownBoldMarkers(e.description),
    })),
    projects: output.projects.map((p) => ({
      ...p,
      description: stripMarkdownBoldMarkers(p.description),
    })),
    education: output.education.map((ed) => ({
      ...ed,
      highlights: ed.highlights.map(stripMarkdownBoldMarkers),
    })),
    skills: output.skills.map(stripMarkdownBoldMarkers),
    languages: output.languages.map(stripMarkdownBoldMarkers),
    awards: output.awards.map(stripMarkdownBoldMarkers),
  };
}

export function stripMarkdownFromExperience<T extends { description: string }>(
  item: T
): T {
  return { ...item, description: stripMarkdownBoldMarkers(item.description) };
}
