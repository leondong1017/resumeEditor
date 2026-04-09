import type { ParsedResume } from "@/lib/types";
import { hasStructuredResumeContent } from "./resume-draft-utils";

/**
 * 将结构化简历拼成纯文本，供 pipeline 的 parse-resume 与后续步骤使用。
 */
export function serializeParsedResumeToText(p: ParsedResume): string {
  const lines: string[] = [];
  const b = p.basicInfo;
  if (b.name.trim()) lines.push(`姓名：${b.name.trim()}`);
  if (b.phone?.trim()) lines.push(`电话：${b.phone.trim()}`);
  if (b.email?.trim()) lines.push(`邮箱：${b.email.trim()}`);
  if (b.location?.trim()) lines.push(`地点：${b.location.trim()}`);
  if (b.linkedin?.trim()) lines.push(`LinkedIn：${b.linkedin.trim()}`);
  if (b.website?.trim()) lines.push(`网站：${b.website.trim()}`);
  if (lines.length) lines.push("");

  if (p.experiences.length > 0) {
    lines.push("## 工作经历");
    for (const e of p.experiences) {
      if (
        !e.company.trim() &&
        !e.title.trim() &&
        !e.description.trim()
      ) {
        continue;
      }
      lines.push(
        `### ${e.company.trim() || "公司"} · ${e.title.trim() || "职位"} · ${e.startDate.trim()}-${e.endDate.trim()}`
      );
      if (e.description.trim()) lines.push(e.description.trim());
      lines.push("");
    }
  }

  if (p.projects.length > 0) {
    lines.push("## 项目经历");
    for (const pr of p.projects) {
      if (!pr.name.trim() && !pr.description.trim()) continue;
      lines.push(
        `### ${pr.name.trim() || "项目"} · ${pr.role.trim() || "角色"} · ${pr.period.trim()}`
      );
      if (pr.description.trim()) lines.push(pr.description.trim());
      lines.push("");
    }
  }

  if (p.education.length > 0) {
    lines.push("## 教育背景");
    for (const ed of p.education) {
      if (!ed.school.trim()) continue;
      lines.push(
        `- ${ed.school.trim()} · ${ed.degree.trim()} · ${ed.major.trim()} · ${ed.period.trim()}`
      );
      for (const h of ed.highlights) {
        if (h.trim()) lines.push(`  - ${h.trim()}`);
      }
    }
    lines.push("");
  }

  if (p.skills.length > 0) {
    lines.push("## 技能");
    lines.push(p.skills.filter((s) => s.trim()).join("、"));
    lines.push("");
  }

  if (p.languages.length > 0) {
    lines.push("## 语言");
    lines.push(p.languages.filter((s) => s.trim()).join("、"));
    lines.push("");
  }

  if (p.awards.length > 0) {
    lines.push("## 荣誉奖项");
    for (const a of p.awards) {
      if (a.trim()) lines.push(`- ${a.trim()}`);
    }
  }

  return lines.join("\n").trim();
}

/** 生成简历正文：优先用结构化拼贴；否则用原始全文 */
export function buildResumeTextForPipeline(
  parsed: ParsedResume,
  rawText: string
): string {
  if (hasStructuredResumeContent(parsed)) {
    return serializeParsedResumeToText(parsed);
  }
  return rawText.trim();
}
