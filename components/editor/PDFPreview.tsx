"use client";

import type { Resume } from "@/lib/types";
import { normalizePdfMultiline } from "@/lib/pdf/normalize-multiline";

interface PDFPreviewProps {
  resume: Resume;
}

export function PDFPreview({ resume }: PDFPreviewProps) {
  const t = resume.meta.template;
  if (t === "modern") return <ModernPreview resume={resume} />;
  if (t === "tech") return <TechPreview resume={resume} />;
  return <ClassicPreview resume={resume} />;
}

const shellClass =
  "bg-white shadow-lg rounded-sm border min-h-[842px] w-full max-w-[595px] mx-auto text-text-primary";

function ClassicPreview({ resume }: { resume: Resume }) {
  const { output } = resume;
  return (
    <div className={`${shellClass} p-8 text-[11px] leading-relaxed`}>
      <div className="text-center mb-4 pb-3 border-b border-border-custom">
        <h1 className="text-lg font-bold">{output.basicInfo.name}</h1>
        <div className="flex items-center justify-center gap-3 mt-1 text-text-muted text-[10px] flex-wrap">
          {output.basicInfo.phone && <span>{output.basicInfo.phone}</span>}
          {output.basicInfo.email && <span>{output.basicInfo.email}</span>}
          {output.basicInfo.location && <span>{output.basicInfo.location}</span>}
          {output.basicInfo.linkedin && <span>{output.basicInfo.linkedin}</span>}
          {output.basicInfo.website && <span>{output.basicInfo.website}</span>}
        </div>
      </div>

      {output.summary && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            个人总结
          </h2>
          <p className="whitespace-pre-line">{normalizePdfMultiline(output.summary)}</p>
        </section>
      )}

      {output.experiences.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            工作经历
          </h2>
          {output.experiences.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-semibold">
                  {exp.company} · {exp.title}
                </span>
                <span className="text-text-muted text-[10px] shrink-0">
                  {exp.startDate} - {exp.endDate}
                </span>
              </div>
              <p className="whitespace-pre-line mt-0.5">
                {normalizePdfMultiline(exp.description)}
              </p>
            </div>
          ))}
        </section>
      )}

      {output.projects.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            项目经历
          </h2>
          {output.projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-semibold">
                  {proj.name} · {proj.role}
                </span>
                <span className="text-text-muted text-[10px] shrink-0">{proj.period}</span>
              </div>
              <p className="whitespace-pre-line mt-0.5">
                {normalizePdfMultiline(proj.description)}
              </p>
            </div>
          ))}
        </section>
      )}

      {output.education.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            教育背景
          </h2>
          {output.education.map((edu, i) => (
            <div key={i} className="mb-1">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-semibold">{edu.school}</span>
                <span className="text-text-muted text-[10px] shrink-0">{edu.period}</span>
              </div>
              <p>
                {edu.degree} · {edu.major}
              </p>
            </div>
          ))}
        </section>
      )}

      {output.skills.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            技能
          </h2>
          <p>{output.skills.join(" · ")}</p>
        </section>
      )}

      {output.awards.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            荣誉奖项
          </h2>
          <ul className="list-disc list-inside">
            {output.awards.map((award, i) => (
              <li key={i}>{award}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ModernPreview({ resume }: { resume: Resume }) {
  const { output } = resume;
  return (
    <div className={`${shellClass} flex text-[11px] leading-relaxed overflow-hidden`}>
      <aside className="w-[30%] shrink-0 bg-subtle border-r border-border-custom p-4 text-[10px]">
        <h1 className="text-base font-bold text-text-primary leading-snug mb-2">
          {output.basicInfo.name}
        </h1>
        <div className="text-text-secondary space-y-0.5">
          {output.basicInfo.phone && <div>{output.basicInfo.phone}</div>}
          {output.basicInfo.email && <div className="break-all">{output.basicInfo.email}</div>}
          {output.basicInfo.location && <div>{output.basicInfo.location}</div>}
          {output.basicInfo.linkedin && <div className="break-all">{output.basicInfo.linkedin}</div>}
          {output.basicInfo.website && <div className="break-all">{output.basicInfo.website}</div>}
        </div>

        {output.summary && (
          <div className="mt-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              个人总结
            </div>
            <p className="text-[9px] text-text-secondary leading-relaxed whitespace-pre-line">
              {normalizePdfMultiline(output.summary)}
            </p>
          </div>
        )}

        {output.skills.length > 0 && (
          <div className="mt-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              技能
            </div>
            <div className="flex flex-wrap gap-1">
              {output.skills.map((s, i) => (
                <span
                  key={i}
                  className="text-[9px] px-1.5 py-0.5 rounded border border-border-custom bg-card-bg text-text-secondary"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {output.education.length > 0 && (
          <div className="mt-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              教育
            </div>
            {output.education.map((edu, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <div className="font-semibold text-text-primary">{edu.school}</div>
                <div className="text-text-secondary text-[9px] mt-0.5">
                  {edu.degree} · {edu.major}
                </div>
                <div className="text-text-muted text-[9px] mt-0.5">{edu.period}</div>
              </div>
            ))}
          </div>
        )}

        {output.awards.length > 0 && (
          <div className="mt-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              荣誉奖项
            </div>
            <ul className="list-disc list-inside text-[9px] text-text-secondary space-y-0.5">
              {output.awards.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0 p-4 pl-5">
        {output.experiences.length > 0 && (
          <section className="mb-3">
            <h2 className="text-xs font-bold text-text-primary border-l-[3px] border-text-primary pl-2 mb-1.5">
              工作经历
            </h2>
            {output.experiences.map((exp, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-semibold">{exp.company}</span>
                  <span className="text-text-muted text-[9px] shrink-0 whitespace-nowrap">
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                <div className="text-text-secondary text-[9.5px]">{exp.title}</div>
                <p className="whitespace-pre-line mt-1 text-[10.5px] leading-relaxed">
                  {normalizePdfMultiline(exp.description)}
                </p>
              </div>
            ))}
          </section>
        )}

        {output.projects.length > 0 && (
          <section className="mb-3">
            <h2 className="text-xs font-bold text-text-primary border-l-[3px] border-text-primary pl-2 mb-1.5">
              项目经历
            </h2>
            {output.projects.map((proj, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-semibold">{proj.name}</span>
                  <span className="text-text-muted text-[9px] shrink-0">{proj.period}</span>
                </div>
                <div className="text-text-secondary text-[9.5px]">{proj.role}</div>
                <p className="whitespace-pre-line mt-1 text-[10.5px] leading-relaxed">
                  {normalizePdfMultiline(proj.description)}
                </p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function TechPreview({ resume }: { resume: Resume }) {
  const { output } = resume;
  return (
    <div className={`${shellClass} p-8 text-[11px] leading-relaxed`}>
      <div className="border-b-2 border-text-primary pb-2.5 mb-3.5">
        <h1 className="text-lg font-bold tracking-tight">{output.basicInfo.name}</h1>
        <div className="mt-1.5 font-mono text-[9px] text-text-secondary flex flex-wrap gap-x-2 gap-y-0.5">
          {output.basicInfo.phone && <span>{output.basicInfo.phone}</span>}
          {output.basicInfo.email && <span>{output.basicInfo.email}</span>}
          {output.basicInfo.location && <span>{output.basicInfo.location}</span>}
          {output.basicInfo.linkedin && <span>{output.basicInfo.linkedin}</span>}
          {output.basicInfo.website && <span>{output.basicInfo.website}</span>}
        </div>
      </div>

      {output.summary && (
        <section className="mb-3">
          <h2 className="font-mono text-[9px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
            <span className="text-text-muted">#</span> 个人总结
          </h2>
          <p className="whitespace-pre-line text-[10.5px] leading-relaxed">
            {normalizePdfMultiline(output.summary)}
          </p>
        </section>
      )}

      {output.experiences.length > 0 && (
        <section className="mb-3">
          <h2 className="font-mono text-[9px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
            <span className="text-text-muted">#</span> 工作经历
          </h2>
          {output.experiences.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-semibold">{exp.company}</span>
                <span className="font-mono text-[9px] text-text-secondary shrink-0 whitespace-nowrap">
                  {exp.startDate} — {exp.endDate}
                </span>
              </div>
              <div className="font-mono text-[9.5px] text-text-secondary">{exp.title}</div>
              <p className="whitespace-pre-line mt-1 text-[10.5px] leading-relaxed">
                {normalizePdfMultiline(exp.description)}
              </p>
            </div>
          ))}
        </section>
      )}

      {output.projects.length > 0 && (
        <section className="mb-3">
          <h2 className="font-mono text-[9px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
            <span className="text-text-muted">#</span> 项目经历
          </h2>
          {output.projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-semibold">{proj.name}</span>
                <span className="font-mono text-[9px] text-text-secondary shrink-0">{proj.period}</span>
              </div>
              <div className="font-mono text-[9.5px] text-text-secondary">{proj.role}</div>
              <p className="whitespace-pre-line mt-1 text-[10.5px] leading-relaxed">
                {normalizePdfMultiline(proj.description)}
              </p>
            </div>
          ))}
        </section>
      )}

      {output.education.length > 0 && (
        <section className="mb-3">
          <h2 className="font-mono text-[9px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
            <span className="text-text-muted">#</span> 教育背景
          </h2>
          {output.education.map((edu, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-semibold">{edu.school}</span>
                <span className="font-mono text-[9px] text-text-secondary shrink-0">{edu.period}</span>
              </div>
              <div className="font-mono text-[9.5px] text-text-secondary">
                {edu.degree} · {edu.major}
              </div>
            </div>
          ))}
        </section>
      )}

      {output.skills.length > 0 && (
        <section className="mb-3">
          <h2 className="font-mono text-[9px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
            <span className="text-text-muted">#</span> 技能栈
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {output.skills.map((s, i) => (
              <code
                key={i}
                className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-border-custom bg-subtle text-text-primary"
              >
                {s}
              </code>
            ))}
          </div>
        </section>
      )}

      {output.awards.length > 0 && (
        <section>
          <h2 className="font-mono text-[9px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
            <span className="text-text-muted">#</span> 荣誉奖项
          </h2>
          <ul className="text-[10.5px] space-y-0.5">
            {output.awards.map((award, i) => (
              <li key={i} className="pl-3 relative before:content-['›'] before:absolute before:left-0 before:font-mono before:text-text-muted">
                {award}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
