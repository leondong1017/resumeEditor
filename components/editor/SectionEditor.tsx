"use client";

import { useState, useCallback } from "react";
import { Resume, WorkExperience, ProjectExperience, Education } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QualityReviewPanel } from "@/components/editor/QualityReviewPanel";
import { ChevronDown, ChevronUp } from "lucide-react";
interface SectionEditorProps {
  resume: Resume;
  onUpdate: (resume: Resume) => void;
  onRegenerateSection: (section: string) => void;
  regenerating: string | null;
  editorTab: string;
  onEditorTabChange: (tab: string) => void;
}

export function SectionEditor({
  resume,
  onUpdate,
  onRegenerateSection,
  regenerating,
  editorTab,
  onEditorTabChange,
}: SectionEditorProps) {
  const output = resume.output;

  const updateField = useCallback(
    <K extends keyof Resume["output"]>(key: K, value: Resume["output"][K]) => {
      const updated = {
        ...resume,
        output: { ...resume.output, [key]: value },
      };
      onUpdate(updated);
    },
    [resume, onUpdate]
  );

  return (
    <Tabs value={editorTab} onValueChange={onEditorTabChange}>
      <TabsList className="w-full">
        <TabsTrigger value="intro">简介总结</TabsTrigger>
        <TabsTrigger value="review">质量审核</TabsTrigger>
        <TabsTrigger value="edit">简历编辑</TabsTrigger>
      </TabsList>

      {/* Tab 1: Intro + Summary */}
      <TabsContent value="intro">
        <div className="space-y-6 pt-4">
          <SectionCard
            title="三行简介"
            description={
              output.threeLineIntro.trim() === ""
                ? "适用于招聘平台个人简介。流水线不再自动生成，请点击「生成」。"
                : "适用于招聘平台个人简介"
            }
            section="threeLineIntro"
            hasContent={output.threeLineIntro.trim() !== ""}
            onRegenerate={onRegenerateSection}
            regenerating={regenerating}
          >
            <Textarea
              value={output.threeLineIntro}
              onChange={(e) => updateField("threeLineIntro", e.target.value)}
              className="min-h-[80px] text-sm"
              placeholder="点击上方「生成」由 AI 生成，或自行填写"
            />
          </SectionCard>

          <SectionCard
            title="个人总结"
            description={
              output.summary.trim() === ""
                ? "流水线不再自动生成，请点击「生成」。"
                : undefined
            }
            section="summary"
            hasContent={output.summary.trim() !== ""}
            onRegenerate={onRegenerateSection}
            regenerating={regenerating}
          >
            <Textarea
              value={output.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              className="min-h-[100px] text-sm"
              placeholder="点击上方「生成」由 AI 生成，或自行填写"
            />
          </SectionCard>
        </div>
      </TabsContent>

      <TabsContent value="review">
        <QualityReviewPanel
          resume={resume}
          onUpdate={onUpdate}
          isActive={editorTab === "review"}
        />
      </TabsContent>

      {/* Tab 3: Resume Editing */}
      <TabsContent value="edit">
        <div className="space-y-6 pt-4">
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
        </div>
      </TabsContent>
    </Tabs>
  );
}

function SectionCard({
  title,
  description,
  section,
  hasContent,
  onRegenerate,
  regenerating,
  children,
}: {
  title: string;
  description?: string;
  section: string;
  hasContent?: boolean;
  onRegenerate: (section: string) => void;
  regenerating: string | null;
  children: React.ReactNode;
}) {
  const label =
    regenerating === section
      ? "生成中..."
      : hasContent
      ? "重新生成"
      : "生成";
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
          {label}
        </Button>
      </div>
      {children}
    </Card>
  );
}

/** 对比编辑版与原文时左右栏统一高度，内部各自滚动 */
const COMPARE_PANE_HEIGHT_CLASS = "h-[min(22rem,45vh)]";

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
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="h-auto gap-1 p-0 text-xs font-normal text-text-muted no-underline hover:text-text-secondary hover:no-underline"
      >
        {expanded ? "隐藏原文" : "查看原文"}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
      {expanded ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="flex min-h-0 flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">当前内容</span>
            <Textarea
              value={experience.description}
              onChange={(e) =>
                onChange({ ...experience, description: e.target.value })
              }
              className={`${COMPARE_PANE_HEIGHT_CLASS} min-h-0 resize-none overflow-y-auto [field-sizing:fixed] text-sm`}
            />
          </div>
          <div className="flex min-h-0 flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">原文（只读）</span>
            <div
              className={`${COMPARE_PANE_HEIGHT_CLASS} min-h-0 overflow-y-auto overscroll-contain rounded-md border border-border-custom bg-subtle p-2 text-xs leading-relaxed text-text-secondary whitespace-pre-wrap`}
            >
              {experience.originalExperience}
            </div>
          </div>
        </div>
      ) : (
        <Textarea
          value={experience.description}
          onChange={(e) => onChange({ ...experience, description: e.target.value })}
          className="min-h-[100px] text-sm"
        />
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
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="h-auto gap-1 p-0 text-xs font-normal text-text-muted no-underline hover:text-text-secondary hover:no-underline"
      >
        {expanded ? "隐藏原文" : "查看原文"}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
      {expanded ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="flex min-h-0 flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">当前内容</span>
            <Textarea
              value={project.description}
              onChange={(e) => onChange({ ...project, description: e.target.value })}
              className={`${COMPARE_PANE_HEIGHT_CLASS} min-h-0 resize-none overflow-y-auto [field-sizing:fixed] text-sm`}
            />
          </div>
          <div className="flex min-h-0 flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">原文（只读）</span>
            <div
              className={`${COMPARE_PANE_HEIGHT_CLASS} min-h-0 overflow-y-auto overscroll-contain rounded-md border border-border-custom bg-subtle p-2 text-xs leading-relaxed text-text-secondary whitespace-pre-wrap`}
            >
              {project.originalExperience}
            </div>
          </div>
        </div>
      ) : (
        <Textarea
          value={project.description}
          onChange={(e) => onChange({ ...project, description: e.target.value })}
          className="min-h-[80px] text-sm"
        />
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
