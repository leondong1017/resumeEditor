"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { loadResume, saveResume } from "@/lib/store/resume-store";
import type { PipelineStepStatus, Resume } from "@/lib/types";

const STEP_LABELS: Record<string, string> = {
  "parse-resume": "解析简历",
  "analyze-jd": "分析职位描述",
  "match-rewrite": "匹配与改写经历",
  "gen-strengths": "生成个人优势",
  "gen-intro": "生成三行简介",
  review: "质量审核",
};

const STEP_ORDER = [
  "parse-resume",
  "analyze-jd",
  "match-rewrite",
  "gen-strengths",
  "gen-intro",
  "review",
] as const;

function initSteps(): PipelineStepStatus[] {
  return STEP_ORDER.map((step) => ({
    step,
    label: STEP_LABELS[step],
    status: "pending",
  }));
}

export default function ProcessingPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<PipelineStepStatus[]>(initSteps);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-xl font-semibold text-text-primary text-center mb-2">
          正在生成你的简历
        </h1>
        <p className="text-sm text-text-muted text-center mb-8">
          AI 正在分析和改写你的经历，请稍候...
        </p>

        <Card className="p-6">
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <StepRow key={step.step} step={step} index={idx} />
            ))}
          </div>

          {error && (
            <div className="mt-6 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

function StepRow({ step, index }: { step: PipelineStepStatus; index: number }) {
  const elapsed =
    step.status === "done" && step.startedAt && step.completedAt
      ? ((step.completedAt - step.startedAt) / 1000).toFixed(1)
      : null;

  return (
    <div className="flex items-center gap-3">
      {/* Step number/status icon */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
          step.status === "done"
            ? "bg-primary text-primary-foreground"
            : step.status === "running"
            ? "bg-primary/10 text-primary border-2 border-primary animate-pulse"
            : "bg-subtle text-text-muted"
        }`}
      >
        {step.status === "done" ? "✓" : index + 1}
      </div>

      {/* Label */}
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

      {/* Time */}
      {elapsed && (
        <span className="text-xs text-text-muted">{elapsed}s</span>
      )}
      {step.status === "running" && (
        <span className="text-xs text-text-muted animate-pulse">处理中...</span>
      )}
    </div>
  );
}
