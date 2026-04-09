"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import type { Resume } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { runResumePrecheck } from "@/lib/review/pre-check";
import { hashResumeOutput } from "@/lib/review/hash-output";
import { Loader2 } from "lucide-react";

interface QualityReviewPanelProps {
  resume: Resume;
  onUpdate: (resume: Resume) => void;
  isActive: boolean;
}

export function QualityReviewPanel({
  resume,
  onUpdate,
  isActive,
}: QualityReviewPanelProps) {
  const outputHash = useMemo(() => hashResumeOutput(resume.output), [resume.output]);
  const reviewCompletedAt = resume.analysis.reviewCompletedAt;
  const reviewedHash = resume.analysis.reviewedOutputHash;
  const feedback = resume.analysis.reviewFeedback;

  const isStale = Boolean(
    reviewCompletedAt && feedback && reviewedHash && outputHash !== reviewedHash
  );

  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [precheckIssues, setPrecheckIssues] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const applyInFlight = useRef(false);
  const autoAttempted = useRef(false);

  const runReview = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setPrecheckIssues(null);

    const pre = runResumePrecheck(resume.output);
    if (!pre.ok) {
      setPrecheckIssues(pre.issues);
      inFlight.current = false;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let msg = raw || "审核请求失败";
        try {
          const j = JSON.parse(raw) as { error?: string };
          if (typeof j.error === "string" && j.error) msg = j.error;
        } catch {
          /* 非 JSON */
        }
        throw new Error(msg);
      }
      const data = await res.json();
      const hash = hashResumeOutput(resume.output);
      const updated: Resume = {
        ...resume,
        analysis: {
          ...resume.analysis,
          reviewFeedback: data,
          reviewCompletedAt: new Date().toISOString(),
          reviewedOutputHash: hash,
        },
      };
      onUpdate(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "审核失败");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [resume, onUpdate]);

  const runApplyReview = useCallback(async () => {
    if (applyInFlight.current || isStale || !feedback || !reviewCompletedAt) return;
    applyInFlight.current = true;
    setRewriteError(null);

    const pre = runResumePrecheck(resume.output);
    if (!pre.ok) {
      setRewriteError(pre.issues.join("；"));
      applyInFlight.current = false;
      return;
    }

    setApplyLoading(true);
    try {
      const res = await fetch("/api/ai/apply-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let msg = raw || "重写请求失败";
        try {
          const j = JSON.parse(raw) as { error?: string };
          if (typeof j.error === "string" && j.error) msg = j.error;
        } catch {
          /* 非 JSON */
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as { output: Resume["output"] };
      const updated: Resume = {
        ...resume,
        output: data.output,
        analysis: {
          ...resume.analysis,
          reviewFeedback: null,
          reviewCompletedAt: null,
          reviewedOutputHash: null,
        },
      };
      onUpdate(updated);
    } catch (e) {
      setRewriteError(e instanceof Error ? e.message : "重写失败");
    } finally {
      setApplyLoading(false);
      applyInFlight.current = false;
    }
  }, [
    resume,
    onUpdate,
    feedback,
    reviewCompletedAt,
    isStale,
  ]);

  useEffect(() => {
    if (!isActive) {
      autoAttempted.current = false;
      return;
    }
    if (reviewCompletedAt) return;
    if (autoAttempted.current) return;
    autoAttempted.current = true;
    void runReview();
  }, [isActive, reviewCompletedAt, runReview]);

  return (
    <div className="space-y-4 pt-4">
      {isStale && feedback && (
        <p className="text-xs text-text-secondary bg-subtle border border-border-custom rounded-lg px-3 py-2">
          简历内容在您上次审核后有修改。下方为上次审核结果；「一键重写」已暂停，请先「重新审核」以针对当前简历生成意见。
        </p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-text-muted">
          {reviewCompletedAt
            ? "已完成质量审核，可下载 PDF。可根据意见使用「一键重写」，重写后需重新审核。"
            : "完成审核后即可下载 PDF。"}
        </p>
        <div className="grid w-full max-w-md shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="w-full text-xs"
            disabled={
              loading ||
              applyLoading ||
              !feedback ||
              !reviewCompletedAt ||
              isStale
            }
            onClick={() => void runApplyReview()}
          >
            {applyLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                重写中…
              </>
            ) : (
              "一键重写"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled={loading || applyLoading}
            onClick={() => void runReview()}
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                审核中…
              </>
            ) : (
              "重新审核"
            )}
          </Button>
        </div>
      </div>

      {precheckIssues && precheckIssues.length > 0 && (
        <Card className="p-4 border-accent-red/30 bg-card-bg">
          <p className="text-xs font-medium text-accent-red mb-2">
            未通过本地校验，已暂停调用 AI 审核
          </p>
          <ul className="text-xs text-text-secondary space-y-1 list-disc pl-4">
            {precheckIssues.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
          <p className="text-xs text-text-muted mt-3">
            请在「简历编辑」中修正后，再切换回本标签或点击「重新审核」。
          </p>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-accent-red/30">
          <p className="text-xs text-accent-red">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 text-xs"
            onClick={() => void runReview()}
          >
            重试
          </Button>
        </Card>
      )}

      {rewriteError && (
        <Card className="p-4 border-accent-red/30">
          <p className="text-xs text-accent-red">{rewriteError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 text-xs"
            onClick={() => void runApplyReview()}
          >
            重试重写
          </Button>
        </Card>
      )}

      {loading && !feedback && !precheckIssues && !error && (
        <Card className="p-8 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 text-text-muted animate-spin mb-3" />
          <p className="text-sm text-text-primary">正在进行 AI 质量审核…</p>
          <p className="text-xs text-text-muted mt-1 text-center">
            校验经历与项目的可追溯性，请稍候。
          </p>
        </Card>
      )}

      {feedback && !loading && (
        <Card className="p-4 flex flex-col gap-3 min-h-0">
          {applyLoading && (
            <p className="text-xs text-text-secondary flex items-center gap-2 shrink-0">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              正在根据审核意见修改简历，请稍候…
            </p>
          )}
          <div className="shrink-0">
            <h4 className="text-xs font-medium text-text-primary mb-1">总体评价</h4>
            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
              {feedback.overallAssessment}
            </p>
          </div>
          {feedback.items.length > 0 ? (
            <div className="flex flex-col gap-2 min-h-0">
              <h4 className="text-xs font-medium text-text-primary shrink-0">
                详细项
              </h4>
              <ul className="space-y-2 max-h-[min(50vh,22rem)] overflow-y-auto overscroll-contain pr-1 -mr-1">
                {feedback.items.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs border border-border-custom rounded-md p-3 bg-subtle/50"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SeverityBadge severity={item.severity} />
                      <span className="text-text-muted">{item.section}</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed">{item.message}</p>
                    {item.suggestedText && (
                      <p className="text-text-muted mt-2 pt-2 border-t border-border-custom">
                        <span className="font-medium text-text-secondary">建议：</span>
                        {item.suggestedText}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-text-muted shrink-0">
              未列出细分项，请参阅总体评价。
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "error" | "warning" | "suggestion" }) {
  const map = {
    error: {
      label: "错误",
      className:
        "border-destructive/25 bg-destructive/10 text-destructive",
    },
    warning: {
      label: "注意",
      className:
        "border-border-custom bg-muted text-text-secondary",
    },
    suggestion: {
      label: "建议",
      className: "border-border-custom bg-subtle text-text-secondary",
    },
  } as const;
  const m = map[severity];
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${m.className}`}
    >
      {m.label}
    </span>
  );
}
