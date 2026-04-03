"use client";

import { Resume } from "@/lib/types";

interface PDFPreviewProps {
  resume: Resume;
}

export function PDFPreview({ resume }: PDFPreviewProps) {
  const { output } = resume;

  return (
    <div className="bg-white shadow-lg rounded-sm border p-8 text-text-primary min-h-[842px] w-full max-w-[595px] mx-auto text-[11px] leading-relaxed">
      {/* Header - Basic Info */}
      <div className="text-center mb-4 pb-3 border-b border-border-custom">
        <h1 className="text-lg font-bold">{output.basicInfo.name}</h1>
        <div className="flex items-center justify-center gap-3 mt-1 text-text-muted text-[10px] flex-wrap">
          {output.basicInfo.phone && <span>{output.basicInfo.phone}</span>}
          {output.basicInfo.email && <span>{output.basicInfo.email}</span>}
          {output.basicInfo.location && <span>{output.basicInfo.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {output.summary && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            个人总结
          </h2>
          <p className="whitespace-pre-line">{output.summary}</p>
        </section>
      )}

      {/* Work Experience */}
      {output.experiences.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            工作经历
          </h2>
          {output.experiences.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">
                  {exp.company} · {exp.title}
                </span>
                <span className="text-text-muted text-[10px]">
                  {exp.startDate} - {exp.endDate}
                </span>
              </div>
              <p className="whitespace-pre-line mt-0.5">{exp.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {output.projects.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            项目经历
          </h2>
          {output.projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">
                  {proj.name} · {proj.role}
                </span>
                <span className="text-text-muted text-[10px]">
                  {proj.period}
                </span>
              </div>
              <p className="whitespace-pre-line mt-0.5">{proj.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {output.education.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            教育背景
          </h2>
          {output.education.map((edu, i) => (
            <div key={i} className="mb-1">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">{edu.school}</span>
                <span className="text-text-muted text-[10px]">
                  {edu.period}
                </span>
              </div>
              <p>
                {edu.degree} · {edu.major}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {output.skills.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1 border-b border-border-custom pb-0.5">
            技能
          </h2>
          <p>{output.skills.join(" · ")}</p>
        </section>
      )}

      {/* Awards */}
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
