import type { ParsedResume } from "@/lib/types";

function nonEmpty(s: string | undefined): boolean {
  return Boolean(s?.trim());
}

/** 是否有任意已填内容（结构化或原始全文）——用于上传覆盖前确认 */
export function hasResumeDraftContent(
  parsed: ParsedResume,
  rawText: string
): boolean {
  if (rawText.trim()) return true;
  const b = parsed.basicInfo;
  if (
    nonEmpty(b.name) ||
    nonEmpty(b.phone) ||
    nonEmpty(b.email) ||
    nonEmpty(b.location) ||
    nonEmpty(b.linkedin) ||
    nonEmpty(b.website)
  ) {
    return true;
  }
  if (
    parsed.experiences.some(
      (e) =>
        nonEmpty(e.company) ||
        nonEmpty(e.title) ||
        nonEmpty(e.startDate) ||
        nonEmpty(e.endDate) ||
        nonEmpty(e.description)
    )
  ) {
    return true;
  }
  if (
    parsed.projects.some(
      (p) =>
        nonEmpty(p.name) ||
        nonEmpty(p.role) ||
        nonEmpty(p.period) ||
        nonEmpty(p.description)
    )
  ) {
    return true;
  }
  if (
    parsed.education.some(
      (ed) =>
        nonEmpty(ed.school) ||
        nonEmpty(ed.degree) ||
        nonEmpty(ed.major) ||
        nonEmpty(ed.period) ||
        ed.highlights.some(nonEmpty)
    )
  ) {
    return true;
  }
  if (parsed.skills.some(nonEmpty)) return true;
  if (parsed.languages.some(nonEmpty)) return true;
  if (parsed.awards.some(nonEmpty)) return true;
  return false;
}

/** 结构化区块是否有实质内容——用于智能识别覆盖前确认 */
export function hasStructuredResumeContent(parsed: ParsedResume): boolean {
  return hasResumeDraftContent(parsed, "");
}
