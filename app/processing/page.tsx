"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadResume, saveResume } from "@/lib/store/resume-store";
import type { PipelineStepStatus, Resume, JDAnalysis } from "@/lib/types";

const STEP_LABELS: Record<string, string> = {
  "parse-resume": "解析简历",
  "analyze-jd": "分析职位描述",
  "match-rewrite": "匹配与改写经历",
};

const STEP_ORDER = ["parse-resume", "analyze-jd", "match-rewrite"] as const;

function initSteps(): PipelineStepStatus[] {
  return STEP_ORDER.map((step) => ({
    step,
    label: STEP_LABELS[step],
    status: "pending",
  }));
}

interface RewrittenExperience {
  company: string;
  title: string;
  description: string;
  reviewPassed: boolean;
  reviewMessage: string;
}

export default function ProcessingPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<PipelineStepStatus[]>(initSteps);
  const [error, setError] = useState<string | null>(null);
  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysis | null>(null);
  const [rewrittenExperiences, setRewrittenExperiences] = useState<RewrittenExperience[]>([]);
  const [rewriteProgress, setRewriteProgress] = useState<{ completed: number; total: number } | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const resume = loadResume();
    if (!resume) {
      router.replace("/");
      return;
    }

    runPipeline(resume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runPipeline(resume: Resume) {
    const response = await fetch("/api/ai/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: resume.source.resumeText,
        jdText: resume.source.jdText,
        language: resume.meta.language,
        framework: resume.meta.framework,
      }),
    });

    if (!response.ok || !response.body) {
      setError("Pipeline request failed");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6);
        try {
          const event = JSON.parse(json);
          handleEvent(event, resume);
        } catch {
          // skip malformed events
        }
      }
    }
  }

  function handleEvent(
    event: { step: string; status: string; data?: unknown },
    resume: Resume
  ) {
    if (event.step === "error") {
      setError((event.data as { message: string })?.message || "Unknown error");
      return;
    }

    if (event.step === "complete" && event.status === "done") {
      const finalResume = event.data as Resume;
      finalResume.meta.id = resume.meta.id;
      finalResume.meta.createdAt = resume.meta.createdAt;
      saveResume(finalResume);
      setTimeout(() => router.push("/editor"), 500);
      return;
    }

    // Capture intermediate data for live preview
    if (event.step === "analyze-jd" && event.status === "done" && event.data) {
      setJdAnalysis(event.data as JDAnalysis);
    }

    // Match analysis done — update progress tracker
    if (event.step === "match-analyze" && event.status === "done" && event.data) {
      const d = event.data as { total: number };
      setRewriteProgress({ completed: 0, total: d.total });
      return;
    }

    // Individual experience/project rewrite done — add to preview incrementally
    if (event.step === "rewrite-progress" && event.status === "done" && event.data) {
      const d = event.data as {
        type: string;
        completed: number;
        total: number;
        data: { company?: string; name?: string; title?: string; role?: string; description: string };
        inlineReview?: { passed: boolean; message: string; missingKeywords: string[] };
      };
      // Initialize rewriteProgress if match-analyze hasn't arrived yet (B1/B2 parallel)
      setRewriteProgress((prev) => ({ completed: d.completed, total: prev?.total ?? d.total }));
      setRewrittenExperiences((prev) => [
        ...prev,
        {
          company: d.data.company ?? d.data.name ?? "",
          title: d.data.title ?? d.data.role ?? "",
          description: d.data.description,
          reviewPassed: d.inlineReview?.passed ?? true,
          reviewMessage: d.inlineReview?.message ?? "",
        },
      ]);
      return;
    }

    setSteps((prev) =>
      prev.map((s) => {
        if (s.step !== event.step) return s;
        if (event.status === "running") {
          return { ...s, status: "running", startedAt: Date.now() };
        }
        if (event.status === "done") {
          return { ...s, status: "done", completedAt: Date.now() };
        }
        return s;
      })
    );
  }

  const currentStep = steps.find((s) => s.status === "running");
  const allDone = steps.every((s) => s.status === "done");
  const rewriteFraction =
    rewriteProgress && rewriteProgress.total > 0
      ? `${rewriteProgress.completed}/${rewriteProgress.total}`
      : null;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-text-primary text-center mb-2">
          {allDone ? "生成完成，即将跳转..." : "正在生成你的简历"}
        </h1>
        <p className="text-sm text-text-muted text-center mb-8">
          {currentStep?.step === "match-rewrite" && rewriteFraction
            ? `正在改写经历 ${rewriteFraction} 条（可并行完成，无需按顺序等待）`
            : currentStep
            ? `${currentStep.label}中...`
            : allDone
            ? "所有步骤已完成"
            : "AI 正在分析和改写你的经历，请稍候..."}
        </p>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <StepRow
                key={step.step}
                step={step}
                index={idx}
                progress={step.step === "match-rewrite" ? rewriteProgress : null}
              />
            ))}
          </div>

          {error && (
            <div className="mt-6 rounded-md border border-destructive/25 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </Card>

        {/* JD Keywords — grouped by theme, ordered by priority */}
        {jdAnalysis && (
          <div className="animate-slide-up-content mb-6">
            <Card className="p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  职位关键词分析
                </h3>
                {jdAnalysis.companyName && (
                  <p className="text-xs text-text-muted">
                    {jdAnalysis.companyName} · {jdAnalysis.roleName}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                {(jdAnalysis.keywordGroups ?? []).map((group, gi) => {
                  const variant = gi === 0 ? "default" : "secondary";
                  return (
                    <div
                      key={group.category}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${gi * 100}ms` }}
                    >
                      <p className={`text-xs font-medium mb-1.5 ${gi === 0 ? "text-text-primary" : "text-text-muted"}`}>
                        {group.category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.keywords.map((kw, ki) => (
                          <Badge
                            key={kw}
                            variant={variant}
                            className={`text-xs ${gi === 0 && ki === 0 ? "font-semibold" : ""}`}
                          >
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Rewritten Content Preview */}
        {rewrittenExperiences.length > 0 && (
          <div className="animate-slide-up-content">
            <Card className="p-5">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                改写预览
              </h3>
              <div className="space-y-4 max-h-[320px] overflow-y-auto">
                {rewrittenExperiences.map((exp, i) => (
                  <div
                    key={i}
                    className={`animate-fade-in-up border-l-2 pl-3 ${
                      exp.reviewPassed
                        ? "border-border-custom"
                        : "border-l-foreground/25"
                    }`}
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-text-primary">
                        {exp.company} · {exp.title}
                      </p>
                      {!exp.reviewPassed && (
                        <span className="rounded border border-border-custom bg-muted px-1.5 py-0.5 text-xs text-text-secondary">
                          需检查
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line line-clamp-4">
                      {exp.description}
                    </p>
                    {!exp.reviewPassed && exp.reviewMessage && (
                      <p className="mt-1 text-xs text-text-muted">{exp.reviewMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

function StepRow({
  step,
  index,
  progress,
}: {
  step: PipelineStepStatus;
  index: number;
  progress: { completed: number; total: number } | null;
}) {
  const elapsed =
    step.status === "done" && step.startedAt && step.completedAt
      ? ((step.completedAt - step.startedAt) / 1000).toFixed(1)
      : null;

  const runningLabel =
    step.status === "running" && progress && progress.total > 0
      ? `已生成 ${progress.completed} / ${progress.total} 条`
      : "处理中...";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-all ${
          step.status === "done"
            ? "bg-primary text-primary-foreground"
            : step.status === "running"
            ? "bg-primary/10 text-primary border-2 border-primary animate-pulse"
            : "bg-subtle text-text-muted"
        }`}
      >
        {step.status === "done" ? "✓" : index + 1}
      </div>

      <span
        className={`flex-1 text-sm ${
          step.status === "done"
            ? "text-text-primary"
            : step.status === "running"
            ? "text-text-primary font-medium"
            : "text-text-muted"
        }`}
      >
        {step.label}
      </span>

      {elapsed && (
        <span className="text-xs text-text-muted">{elapsed}s</span>
      )}
      {step.status === "running" && (
        <span className="text-xs text-text-muted animate-pulse">{runningLabel}</span>
      )}
    </div>
  );
}
