import type { Resume } from "@/lib/types";
import { normalizePdfMultiline } from "@/lib/pdf/normalize-multiline";
import { escapeHtml } from "./html-escape";

/** 左栏：总结 / 技能 / 教育 / 奖项；右栏：工作 + 项目 */
export function modernTemplate(resume: Resume): string {
  const { output, meta } = resume;
  const isZh = meta.language === "zh";

  const contactParts: string[] = [];
  if (output.basicInfo.phone)
    contactParts.push(`<div>${escapeHtml(output.basicInfo.phone)}</div>`);
  if (output.basicInfo.email)
    contactParts.push(`<div>${escapeHtml(output.basicInfo.email)}</div>`);
  if (output.basicInfo.location)
    contactParts.push(`<div>${escapeHtml(output.basicInfo.location)}</div>`);
  if (output.basicInfo.linkedin)
    contactParts.push(`<div>${escapeHtml(output.basicInfo.linkedin)}</div>`);
  if (output.basicInfo.website)
    contactParts.push(`<div>${escapeHtml(output.basicInfo.website)}</div>`);

  const sidebarSummary =
    output.summary
      ? `<div class="sb-block">
    <div class="sb-label">${isZh ? "个人总结" : "Summary"}</div>
    <p class="sb-summary">${escapeHtml(normalizePdfMultiline(output.summary))}</p>
  </div>`
      : "";

  const sidebarSkills =
    output.skills.length > 0
      ? `<div class="sb-block">
    <div class="sb-label">${isZh ? "技能" : "Skills"}</div>
    <div class="sb-skills">${output.skills.map((s) => `<span class="sb-skill">${escapeHtml(s)}</span>`).join("")}</div>
  </div>`
      : "";

  const sidebarEdu =
    output.education.length > 0
      ? `<div class="sb-block">
    <div class="sb-label">${isZh ? "教育" : "Education"}</div>
    ${output.education
      .map(
        (edu) => `<div class="sb-edu">
      <div class="sb-edu-school">${escapeHtml(edu.school)}</div>
      <div class="sb-edu-meta">${escapeHtml(edu.degree)} · ${escapeHtml(edu.major)}</div>
      <div class="sb-edu-date">${escapeHtml(edu.period)}</div>
    </div>`
      )
      .join("")}
  </div>`
      : "";

  const sidebarAwards =
    output.awards.length > 0
      ? `<div class="sb-block">
    <div class="sb-label">${isZh ? "荣誉奖项" : "Awards"}</div>
    <ul class="sb-awards">${output.awards.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
  </div>`
      : "";

  const expBlock =
    output.experiences.length > 0
      ? `<div class="section">
    <div class="section-title">${isZh ? "工作经历" : "Experience"}</div>
    ${output.experiences
      .map(
        (exp) => `<div class="entry">
      <div class="entry-header">
        <span class="entry-title">${escapeHtml(exp.company)}</span>
        <span class="entry-date">${escapeHtml(exp.startDate)} – ${escapeHtml(exp.endDate)}</span>
      </div>
      <div class="entry-subtitle">${escapeHtml(exp.title)}</div>
      <div class="entry-body">${escapeHtml(normalizePdfMultiline(exp.description))}</div>
    </div>`
      )
      .join("")}
  </div>`
      : "";

  const projBlock =
    output.projects.length > 0
      ? `<div class="section">
    <div class="section-title">${isZh ? "项目经历" : "Projects"}</div>
    ${output.projects
      .map(
        (proj) => `<div class="entry">
      <div class="entry-header">
        <span class="entry-title">${escapeHtml(proj.name)}</span>
        <span class="entry-date">${escapeHtml(proj.period)}</span>
      </div>
      <div class="entry-subtitle">${escapeHtml(proj.role)}</div>
      <div class="entry-body">${escapeHtml(normalizePdfMultiline(proj.description))}</div>
    </div>`
      )
      .join("")}
  </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="${meta.language}">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: ${isZh
        ? "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif"
        : "Inter, -apple-system, 'Segoe UI', Roboto, sans-serif"};
      font-size: 11pt;
      line-height: 1.5;
      color: #18181b;
      padding: 0;
    }

    .layout {
      display: flex;
      align-items: flex-start;
      gap: 0;
      min-height: 100%;
    }

    .sidebar {
      width: 30%;
      flex-shrink: 0;
      background: #f4f4f5;
      padding: 18px 14px;
      border-right: 1px solid #e4e4e7;
    }

    .sidebar h1 {
      font-size: 16pt;
      font-weight: 700;
      line-height: 1.25;
      margin-bottom: 10px;
      color: #18181b;
    }

    .sidebar .contact {
      font-size: 9pt;
      color: #3f3f46;
      line-height: 1.55;
    }

    .sb-block { margin-top: 14px; }
    .contact + .sb-block { margin-top: 16px; }
    .sb-label {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #71717a;
      margin-bottom: 6px;
    }
    .sb-summary {
      font-size: 9pt;
      line-height: 1.55;
      color: #3f3f46;
      white-space: pre-line;
    }
    .sb-skills { display: flex; flex-wrap: wrap; gap: 4px 6px; }
    .sb-skill {
      font-size: 8.5pt;
      background: #fff;
      border: 1px solid #e4e4e7;
      border-radius: 3px;
      padding: 2px 6px;
      color: #3f3f46;
    }
    .sb-edu { margin-bottom: 10px; }
    .sb-edu-school { font-weight: 600; font-size: 9.5pt; }
    .sb-edu-meta { font-size: 8.5pt; color: #3f3f46; margin-top: 2px; }
    .sb-edu-date { font-size: 8pt; color: #71717a; margin-top: 2px; }
    .sb-awards { list-style: disc inside; font-size: 9pt; color: #3f3f46; }
    .sb-awards li { margin-bottom: 3px; }

    .main {
      flex: 1;
      min-width: 0;
      padding: 18px 16px 18px 18px;
    }

    .section { margin-bottom: 14px; }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #18181b;
      border-left: 3px solid #18181b;
      padding-left: 8px;
      margin-bottom: 8px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .entry { margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .entry-title { font-weight: 600; font-size: 11pt; }
    .entry-date { font-size: 9pt; color: #71717a; white-space: nowrap; }
    .entry-subtitle { font-size: 9.5pt; color: #3f3f46; margin-top: 2px; }
    .entry-body { margin-top: 4px; white-space: pre-line; font-size: 10.5pt; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <h1>${escapeHtml(output.basicInfo.name)}</h1>
      <div class="contact">${contactParts.join("")}</div>
      ${sidebarSummary}
      ${sidebarSkills}
      ${sidebarEdu}
      ${sidebarAwards}
    </aside>
    <main class="main">
      ${expBlock}
      ${projBlock}
    </main>
  </div>
</body>
</html>`;
}
