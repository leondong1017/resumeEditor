import type { Resume } from "@/lib/types";
import { normalizePdfMultiline } from "@/lib/pdf/normalize-multiline";
import { escapeHtml } from "./html-escape";

const mono =
  "ui-monospace, 'SF Mono', 'Cascadia Code', 'Consolas', 'Liberation Mono', Menlo, monospace";

/** 偏工程师：等宽标题/日期/技能，结构清晰 */
export function techTemplate(resume: Resume): string {
  const { output, meta } = resume;
  const isZh = meta.language === "zh";

  const contactInner = [
    output.basicInfo.phone,
    output.basicInfo.email,
    output.basicInfo.location,
    output.basicInfo.linkedin,
    output.basicInfo.website,
  ]
    .filter(Boolean)
    .map((s) => `<span>${escapeHtml(s!)}</span>`)
    .join("");

  const summaryBlock =
    output.summary
      ? `<div class="section">
    <div class="section-title"><span class="section-hash">#</span> ${isZh ? "个人总结" : "SUMMARY"}</div>
    <p class="summary">${escapeHtml(normalizePdfMultiline(output.summary))}</p>
  </div>`
      : "";

  const expBlock =
    output.experiences.length > 0
      ? `<div class="section">
    <div class="section-title"><span class="section-hash">#</span> ${isZh ? "工作经历" : "EXPERIENCE"}</div>
    ${output.experiences
      .map(
        (exp) => `<div class="entry">
      <div class="entry-header">
        <span class="entry-title">${escapeHtml(exp.company)}</span>
        <span class="entry-date">${escapeHtml(exp.startDate)} — ${escapeHtml(exp.endDate)}</span>
      </div>
      <div class="entry-role">${escapeHtml(exp.title)}</div>
      <div class="entry-body">${escapeHtml(normalizePdfMultiline(exp.description))}</div>
    </div>`
      )
      .join("")}
  </div>`
      : "";

  const projBlock =
    output.projects.length > 0
      ? `<div class="section">
    <div class="section-title"><span class="section-hash">#</span> ${isZh ? "项目经历" : "PROJECTS"}</div>
    ${output.projects
      .map(
        (proj) => `<div class="entry">
      <div class="entry-header">
        <span class="entry-title">${escapeHtml(proj.name)}</span>
        <span class="entry-date">${escapeHtml(proj.period)}</span>
      </div>
      <div class="entry-role">${escapeHtml(proj.role)}</div>
      <div class="entry-body">${escapeHtml(normalizePdfMultiline(proj.description))}</div>
    </div>`
      )
      .join("")}
  </div>`
      : "";

  const eduBlock =
    output.education.length > 0
      ? `<div class="section">
    <div class="section-title"><span class="section-hash">#</span> ${isZh ? "教育背景" : "EDUCATION"}</div>
    ${output.education
      .map(
        (edu) => `<div class="entry">
      <div class="entry-header">
        <span class="entry-title">${escapeHtml(edu.school)}</span>
        <span class="entry-date">${escapeHtml(edu.period)}</span>
      </div>
      <div class="entry-role">${escapeHtml(edu.degree)} · ${escapeHtml(edu.major)}</div>
      ${
        edu.highlights.length > 0
          ? `<div class="entry-body highlights">${edu.highlights.map(escapeHtml).join(" · ")}</div>`
          : ""
      }
    </div>`
      )
      .join("")}
  </div>`
      : "";

  const skillsBlock =
    output.skills.length > 0
      ? `<div class="section">
    <div class="section-title"><span class="section-hash">#</span> ${isZh ? "技能栈" : "STACK"}</div>
    <div class="skills-line">${output.skills.map((s) => `<code>${escapeHtml(s)}</code>`).join("")}</div>
  </div>`
      : "";

  const awardsBlock =
    output.awards.length > 0
      ? `<div class="section">
    <div class="section-title"><span class="section-hash">#</span> ${isZh ? "荣誉奖项" : "AWARDS"}</div>
    <ul class="awards">${output.awards.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
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

    .topbar {
      border-bottom: 2px solid #18181b;
      padding-bottom: 10px;
      margin-bottom: 14px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .topbar h1 {
      font-size: 18pt;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .topbar .contact {
      margin-top: 6px;
      font-family: ${mono};
      font-size: 9pt;
      color: #3f3f46;
    }

    .topbar .contact span + span::before {
      content: "  ·  ";
      color: #a1a1aa;
    }

    .section { margin-bottom: 12px; }

    .section-title {
      font-family: ${mono};
      font-size: 9.5pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #27272a;
      margin-bottom: 8px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .section-hash { color: #71717a; margin-right: 4px; }

    .entry {
      margin-bottom: 9px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 10px;
    }

    .entry-title { font-weight: 600; font-size: 11pt; }

    .entry-date {
      font-family: ${mono};
      font-size: 9pt;
      color: #52525b;
      white-space: nowrap;
    }

    .entry-role {
      font-family: ${mono};
      font-size: 9.5pt;
      color: #3f3f46;
      margin-top: 2px;
    }

    .entry-body {
      margin-top: 4px;
      white-space: pre-line;
      font-size: 10.5pt;
      line-height: 1.55;
    }

    .entry-body.highlights { white-space: normal; }

    .summary {
      font-size: 10.5pt;
      line-height: 1.6;
      white-space: pre-line;
    }

    .skills-line {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 8px;
      align-items: center;
    }

    .skills-line code {
      font-family: ${mono};
      font-size: 9pt;
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 3px;
      padding: 2px 7px;
      color: #27272a;
    }

    .awards li {
      list-style: none;
      font-size: 10.5pt;
      padding-left: 14px;
      position: relative;
    }
    .awards li::before {
      content: "›";
      position: absolute;
      left: 0;
      font-family: ${mono};
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>${escapeHtml(output.basicInfo.name)}</h1>
    <div class="contact">${contactInner}</div>
  </div>

  ${summaryBlock}
  ${expBlock}
  ${projBlock}
  ${eduBlock}
  ${skillsBlock}
  ${awardsBlock}
</body>
</html>`;
}
