"use client";

import { useState, useCallback } from "react";
import { Resume, WorkExperience, ProjectExperience, Education } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { saveResume } from "@/lib/store/resume-store";

interface SectionEditorProps {
  resume: Resume;
  onUpdate: (resume: Resume) => void;
  onRegenerateSection: (section: string) => void;
  regenerating: string | null;
}

export function SectionEditor({
  resume,
  onUpdate,
  onRegenerateSection,
  regenerating,
}: SectionEditorProps) {
  const output = resume.output;

  const updateField = useCallback(
    <K extends keyof Resume["output"]>(key: K, value: Resume["output"][K]) => {
      const updated = {
        ...resume,
        output: { ...resume.output, [key]: value },
      };
      onUpdate(updated);
      saveResume(updated);
    },
    [resume, onUpdate]
  );

  return (
    <div className="space-y-6">
      {/* Three-line intro */}
      <SectionCard
        title="三行简介"
        description="适用于招聘平台个人简介"
        section="threeLineIntro"
        onRegenerate={onRegenerateSection}
        regenerating={regenerating}
      >
        <Textarea
          value={output.threeLineIntro}
          onChange={(e) => updateField("threeLineIntro", e.target.value)}
          className="min-h-[80px] text-sm"
        />
      </SectionCard>

      {/* Summary */}
      <SectionCard
        title="个人总结"
        section="summary"
        onRegenerate={onRegenerateSection}
        regenerating={regenerating}
      >
        <Textarea
          value={output.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          className="min-h-[100px] text-sm"
        />
      </SectionCard>

      {/* Work Experiences */}
      <SectionCard
        title="工作经历"
        section="experiences"
        onRegenerate={onRegenerateSection}
        regenerating={regenerating}
      >
        <div className="space-y-4">
          {output.experiences.map((exp, i) => (
            <ExperienceCard
              key={i}
              experience={exp}
              onChange={(updated) => {
                const exps = [...output.experiences];
                exps[i] = updated;
                updateField("experiences", exps);
              }}
            />
          ))}
        </div>
      </SectionCard>

      {/* Projects */}
      {output.projects.length > 0 && (
        <SectionCard
          title="项目经历"
          section="projects"
          onRegenerate={onRegenerateSection}
          regenerating={regenerating}
        >
          <div className="space-y-4">
            {output.projects.map((proj, i) => (
              <ProjectCard
                key={i}
                project={proj}
                onChange={(updated) => {
                  const projs = [...output.projects];
                  projs[i] = updated;
                  updateField("projects", projs);
                }}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Education */}
      <SectionCard
        title="教育背景"
        section="education"
        onRegenerate={onRegenerateSection}
        regenerating={regenerating}
      >
        <div className="space-y-3">
          {output.education.map((edu, i) => (
            <EducationCard
              key={i}
              education={edu}
              onChange={(updated) => {
                const edus = [...output.education];
                edus[i] = updated;
                updateField("education", edus);
              }}
            />
          ))}
        </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard
        title="技能"
        section="skills"
        onRegenerate={onRegenerateSection}
        regenerating={regenerating}
      >
        <Textarea
          value={output.skills.join("\n")}
          onChange={(e) =>
            updateField(
              "skills",
              e.target.value.split("\n").filter((s) => s.trim())
            )
          }
          className="min-h-[80px] text-sm"
          placeholder="每行一个技能"
        />
      </SectionCard>

      {/* Awards */}
      {output.awards.length > 0 && (
        <SectionCard
          title="荣誉奖项"
          section="awards"
          onRegenerate={onRegenerateSection}
          regenerating={regenerating}
        >
          <Textarea
            value={output.awards.join("\n")}
            onChange={(e) =>
              updateField(
                "awards",
                e.target.value.split("\n").filter((s) => s.trim())
              )
            }
            className="min-h-[60px] text-sm"
          />
        </SectionCard>
      )}

      {/* Review feedback */}
      {resume.analysis.reviewFeedback && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <h3 className="text-sm font-medium text-text-primary mb-3">
            质量审核反馈
          </h3>
          <p className="text-xs text-text-secondary mb-3">
            {resume.analysis.reviewFeedback.overallAssessment}
          </p>
          <div className="space-y-2">
            {resume.analysis.reviewFeedback.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge
                  variant={
                    item.severity === "error"
                      ? "destructive"
                      : item.severity === "warning"
                      ? "outline"
                      : "secondary"
                  }
                  className="text-xs shrink-0 mt-0.5"
                >
                  {item.severity === "error"
                    ? "错误"
                    : item.severity === "warning"
                    ? "警告"
                    : "建议"}
                </Badge>
                <div className="text-xs text-text-secondary">
                  <span className="font-medium">[{item.section}]</span>{" "}
                  {item.message}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  section,
  onRegenerate,
  regenerating,
  children,
}: {
  title: string;
  description?: string;
  section: string;
  onRegenerate: (section: string) => void;
  regenerating: string | null;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-text-primary">{title}</h3>
          {description && (
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRegenerate(section)}
          disabled={regenerating !== null}
          className="text-xs"
        >
          {regenerating === section ? "重新生成中..." : "重新生成"}
        </Button>
      </div>
      {children}
    </Card>
  );
}

function ExperienceCard({
  experience,
  onChange,
}: {
  experience: WorkExperience;
  onChange: (exp: WorkExperience) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {experience.company} · {experience.title}
          </p>
          <p className="text-xs text-text-muted">
            {experience.startDate} - {experience.endDate}
          </p>
        </div>
      </div>
      <Textarea
        value={experience.description}
        onChange={(e) => onChange({ ...experience, description: e.target.value })}
        className="min-h-[100px] text-sm"
      />
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-text-muted hover:text-text-secondary"
      >
        {expanded ? "隐藏原文" : "查看原文"}
      </button>
      {expanded && (
        <div className="text-xs text-text-muted bg-subtle p-2 rounded">
          {experience.originalExperience}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onChange,
}: {
  project: ProjectExperience;
  onChange: (proj: ProjectExperience) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div>
        <p className="text-sm font-medium text-text-primary">
          {project.name} · {project.role}
        </p>
        <p className="text-xs text-text-muted">{project.period}</p>
      </div>
      <Textarea
        value={project.description}
        onChange={(e) => onChange({ ...project, description: e.target.value })}
        className="min-h-[80px] text-sm"
      />
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-text-muted hover:text-text-secondary"
      >
        {expanded ? "隐藏原文" : "查看原文"}
      </button>
      {expanded && (
        <div className="text-xs text-text-muted bg-subtle p-2 rounded">
          {project.originalExperience}
        </div>
      )}
    </div>
  );
}

function EducationCard({
  education,
  onChange,
}: {
  education: Education;
  onChange: (edu: Education) => void;
}) {
  return (
    <div className="border rounded-md p-3 space-y-1">
      <p className="text-sm font-medium text-text-primary">
        {education.school}
      </p>
      <p className="text-xs text-text-secondary">
        {education.degree} · {education.major} · {education.period}
      </p>
      {education.highlights.length > 0 && (
        <Textarea
          value={education.highlights.join("\n")}
          onChange={(e) =>
            onChange({
              ...education,
              highlights: e.target.value.split("\n").filter((s) => s.trim()),
            })
          }
          className="min-h-[60px] text-xs mt-2"
        />
      )}
    </div>
  );
}
