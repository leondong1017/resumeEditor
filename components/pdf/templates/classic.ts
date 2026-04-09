import { Resume } from "@/lib/types";
import { normalizePdfMultiline } from "@/lib/pdf/normalize-multiline";
import { escapeHtml } from "./html-escape";

export function classicTemplate(resume: Resume): string {
  const { output, meta } = resume;
  const isZh = meta.language === "zh";

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
      /* 页边距由 Playwright pdf margin 统一控制；避免 body padding 在分页时只在「整块」顶部生效导致次页顶格 */
      padding: 0;
    }

    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #18181b;
      break-after: avoid;
      page-break-after: avoid;
    }

    .header h1 {
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: 2px;
    }

    .header .contact {
      margin-top: 6px;
      font-size: 10pt;
      color: #3f3f46;
    }

    .header .contact span + span::before {
      content: " | ";
      color: #a1a1aa;
    }

    .section {
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #18181b;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 3px;
      margin-bottom: 8px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .entry {
      margin-bottom: 8px;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .entry-title {
      font-weight: 600;
      font-size: 11pt;
    }

    .entry-date {
      font-size: 10pt;
      color: #71717a;
      white-space: nowrap;
    }

    .entry-subtitle {
      font-size: 10pt;
      color: #3f3f46;
    }

    .entry-body {
      margin-top: 3px;
      white-space: pre-line;
    }

    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
    }

    .awards li {
      list-style: disc inside;
    }

    .summary {
      font-size: 11pt;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(output.basicInfo.name)}</h1>
    <div class="contact">
      ${output.basicInfo.phone ? `<span>${escapeHtml(output.basicInfo.phone)}</span>` : ""}
      ${output.basicInfo.email ? `<span>${escapeHtml(output.basicInfo.email)}</span>` : ""}
      ${output.basicInfo.location ? `<span>${escapeHtml(output.basicInfo.location)}</span>` : ""}
      ${output.basicInfo.linkedin ? `<span>${escapeHtml(output.basicInfo.linkedin)}</span>` : ""}
    </div>
  </div>

  ${
    output.summary
      ? `<div class="section">
    <div class="section-title">${isZh ? "个人总结" : "SUMMARY"}</div>
    <p class="summary">${escapeHtml(output.summary)}</p>
  </div>`
      : ""
  }

  ${
    output.experiences.length > 0
      ? `<div class="section">
    <div class="section-title">${isZh ? "工作经历" : "EXPERIENCE"}</div>
    ${output.experiences
      .map(
        (exp) => `<div class="entry">
      <div class="entry-header">
        <span class="entry-title">${escapeHtml(exp.company)}</span>
        <span class="entry-date">${escapeHtml(exp.startDate)} - ${escapeHtml(exp.endDate)}</span>
      </div>
      <div class="entry-subtitle">${escapeHtml(exp.title)}</div>
      <div class="entry-body">${escapeHtml(normalizePdfMultiline(exp.description))}</div>
    </div>`
      )
      .join("")}
  </div>`
      : ""
  }

  ${
    output.projects.length > 0
      ? `<div class="section">
    <div class="section-title">${isZh ? "项目经历" : "PROJECTS"}</div>
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
      : ""
  }

  ${
    output.education.length > 0
      ? `<div class="section">
    <div class="section-title">${isZh ? "教育背景" : "EDUCATION"}</div>
    ${output.education
      .map(
        (edu) => `<div class="entry">
      <div class="entry-header">
        <span class="entry-title">${escapeHtml(edu.school)}</span>
        <span class="entry-date">${escapeHtml(edu.period)}</span>
      </div>
      <div class="entry-subtitle">${escapeHtml(edu.degree)} · ${escapeHtml(edu.major)}</div>
      ${edu.highlights.length > 0 ? `<div class="entry-body">${edu.highlights.map(escapeHtml).join("; ")}</div>` : ""}
    </div>`
      )
      .join("")}
  </div>`
      : ""
  }

  ${
    output.skills.length > 0
      ? `<div class="section">
    <div class="section-title">${isZh ? "技能" : "SKILLS"}</div>
    <div class="skills">${output.skills.map((s) => escapeHtml(s)).join(" · ")}</div>
  </div>`
      : ""
  }

  ${
    output.awards.length > 0
      ? `<div class="section">
    <div class="section-title">${isZh ? "荣誉奖项" : "AWARDS"}</div>
    <ul class="awards">${output.awards.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
  </div>`
      : ""
  }
</body>
</html>`;
}
