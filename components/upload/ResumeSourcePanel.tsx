"use client";

import { useRef, useState } from "react";
import type { ParsedResume } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  hasResumeDraftContent,
  hasStructuredResumeContent,
} from "@/lib/resume/resume-draft-utils";
import {
  extractTextFromFile,
  validateUploadFileMeta,
} from "@/lib/upload/extract-client-file";
import { Upload, Plus, Trash2 } from "lucide-react";

const inputClass =
  "flex h-8 w-full rounded-md border border-border-custom bg-transparent px-2 py-1 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface ResumeSourcePanelProps {
  language: "zh" | "en";
  parsed: ParsedResume;
  rawText: string;
  onParsedChange: (p: ParsedResume) => void;
  onRawTextChange: (t: string) => void;
}

export function ResumeSourcePanel({
  language,
  parsed,
  rawText,
  onParsedChange,
  onRawTextChange,
}: ResumeSourcePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadOverwriteOpen, setUploadOverwriteOpen] = useState(false);
  const [recognizeOverwriteOpen, setRecognizeOverwriteOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function updateBasic<K extends keyof ParsedResume["basicInfo"]>(
    key: K,
    value: ParsedResume["basicInfo"][K]
  ) {
    onParsedChange({
      ...parsed,
      basicInfo: { ...parsed.basicInfo, [key]: value },
    });
  }

  async function executeParse(overrideResumeText?: string) {
    setRecognizeOverwriteOpen(false);
    const source = (overrideResumeText ?? rawText).trim();
    if (!source) {
      setParseError("没有可识别的原文");
      return;
    }
    setRecognizing(true);
    setParseError(null);
    try {
      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: source, language }),
      });
      const raw = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(raw) as unknown;
      } catch {
        throw new Error(
          res.ok ? "识别结果格式异常" : "识别服务暂时不可用"
        );
      }
      if (!res.ok) {
        const err =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "识别失败";
        throw new Error(err);
      }
      onParsedChange(data as ParsedResume);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "识别失败");
    } finally {
      setRecognizing(false);
    }
  }

  async function applyFile(file: File) {
    setExtractError(null);
    setExtracting(true);
    try {
      const trimmed = await extractTextFromFile(file);
      onRawTextChange(trimmed);
      if (!trimmed) return;
      if (hasStructuredResumeContent(parsed)) {
        setRecognizeOverwriteOpen(true);
      } else {
        await executeParse(trimmed);
      }
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "文件处理失败");
    } finally {
      setExtracting(false);
      setPendingFile(null);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setExtractError(null);
    const metaErr = validateUploadFileMeta(file);
    if (metaErr) {
      setExtractError(metaErr);
      return;
    }

    if (hasResumeDraftContent(parsed, rawText)) {
      setPendingFile(file);
      setUploadOverwriteOpen(true);
    } else {
      void applyFile(file);
    }
  }

  const charHint =
    (hasStructuredResumeContent(parsed) ? "结构化已填" : "") +
    (rawText.length ? ` · 原文 ${rawText.length} 字` : "");

  return (
    <Card className="p-5 flex flex-col gap-3 min-h-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <label className="text-sm font-medium text-text-secondary shrink-0">
          你的简历
        </label>
        <div className="flex w-full justify-end sm:w-auto sm:shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.rtf,application/pdf,text/plain,application/rtf,text/rtf"
            className="hidden"
            onChange={onPickFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-h-7 w-full max-w-full justify-center gap-x-1 py-1.5 text-xs whitespace-normal sm:w-auto sm:max-w-none"
            disabled={extracting || recognizing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 text-center leading-tight">
              {extracting ? "读取中…" : "上传 .pdf / .txt / .rtf"}
            </span>
          </Button>
        </div>
      </div>

      {extractError && (
        <p className="text-xs text-accent-red">{extractError}</p>
      )}
      {parseError && (
        <p className="text-xs text-accent-red">{parseError}</p>
      )}
      {recognizing && (
        <p className="text-xs text-text-secondary">正在根据原文识别结构化字段…</p>
      )}

      <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1 border border-border-custom rounded-lg p-3 bg-subtle/40">
        <p className="text-xs font-medium text-text-muted">基本信息</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            className={inputClass}
            placeholder="姓名"
            value={parsed.basicInfo.name}
            onChange={(e) => updateBasic("name", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="电话"
            value={parsed.basicInfo.phone ?? ""}
            onChange={(e) => updateBasic("phone", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="邮箱"
            value={parsed.basicInfo.email ?? ""}
            onChange={(e) => updateBasic("email", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="地点"
            value={parsed.basicInfo.location ?? ""}
            onChange={(e) => updateBasic("location", e.target.value)}
          />
        </div>

        <SectionHeader
          title="工作经历"
          onAdd={() =>
            onParsedChange({
              ...parsed,
              experiences: [
                ...parsed.experiences,
                {
                  company: "",
                  title: "",
                  startDate: "",
                  endDate: "",
                  description: "",
                },
              ],
            })
          }
        />
        {parsed.experiences.map((exp, i) => (
          <div
            key={i}
            className="border border-border-custom rounded-md p-2 space-y-2 bg-card-bg"
          >
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-text-muted"
                onClick={() =>
                  onParsedChange({
                    ...parsed,
                    experiences: parsed.experiences.filter((_, j) => j !== i),
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={inputClass}
                placeholder="公司"
                value={exp.company}
                onChange={(e) => {
                  const next = [...parsed.experiences];
                  next[i] = { ...exp, company: e.target.value };
                  onParsedChange({ ...parsed, experiences: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="职位"
                value={exp.title}
                onChange={(e) => {
                  const next = [...parsed.experiences];
                  next[i] = { ...exp, title: e.target.value };
                  onParsedChange({ ...parsed, experiences: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="开始时间"
                value={exp.startDate}
                onChange={(e) => {
                  const next = [...parsed.experiences];
                  next[i] = { ...exp, startDate: e.target.value };
                  onParsedChange({ ...parsed, experiences: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="结束时间"
                value={exp.endDate}
                onChange={(e) => {
                  const next = [...parsed.experiences];
                  next[i] = { ...exp, endDate: e.target.value };
                  onParsedChange({ ...parsed, experiences: next });
                }}
              />
            </div>
            <Textarea
              placeholder="工作描述"
              value={exp.description}
              onChange={(e) => {
                const next = [...parsed.experiences];
                next[i] = { ...exp, description: e.target.value };
                onParsedChange({ ...parsed, experiences: next });
              }}
              className="min-h-[72px] text-xs"
            />
          </div>
        ))}

        <SectionHeader
          title="项目经历"
          onAdd={() =>
            onParsedChange({
              ...parsed,
              projects: [
                ...parsed.projects,
                { name: "", role: "", period: "", description: "" },
              ],
            })
          }
        />
        {parsed.projects.map((pr, i) => (
          <div
            key={i}
            className="border border-border-custom rounded-md p-2 space-y-2 bg-card-bg"
          >
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-text-muted"
                onClick={() =>
                  onParsedChange({
                    ...parsed,
                    projects: parsed.projects.filter((_, j) => j !== i),
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={inputClass}
                placeholder="项目名称"
                value={pr.name}
                onChange={(e) => {
                  const next = [...parsed.projects];
                  next[i] = { ...pr, name: e.target.value };
                  onParsedChange({ ...parsed, projects: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="角色"
                value={pr.role}
                onChange={(e) => {
                  const next = [...parsed.projects];
                  next[i] = { ...pr, role: e.target.value };
                  onParsedChange({ ...parsed, projects: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="周期"
                value={pr.period}
                onChange={(e) => {
                  const next = [...parsed.projects];
                  next[i] = { ...pr, period: e.target.value };
                  onParsedChange({ ...parsed, projects: next });
                }}
              />
            </div>
            <Textarea
              placeholder="项目描述"
              value={pr.description}
              onChange={(e) => {
                const next = [...parsed.projects];
                next[i] = { ...pr, description: e.target.value };
                onParsedChange({ ...parsed, projects: next });
              }}
              className="min-h-[72px] text-xs"
            />
          </div>
        ))}

        <SectionHeader
          title="教育背景"
          onAdd={() =>
            onParsedChange({
              ...parsed,
              education: [
                ...parsed.education,
                {
                  school: "",
                  degree: "",
                  major: "",
                  period: "",
                  highlights: [],
                },
              ],
            })
          }
        />
        {parsed.education.map((ed, i) => (
          <div
            key={i}
            className="border border-border-custom rounded-md p-2 space-y-2 bg-card-bg"
          >
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-text-muted"
                onClick={() =>
                  onParsedChange({
                    ...parsed,
                    education: parsed.education.filter((_, j) => j !== i),
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={inputClass}
                placeholder="学校"
                value={ed.school}
                onChange={(e) => {
                  const next = [...parsed.education];
                  next[i] = { ...ed, school: e.target.value };
                  onParsedChange({ ...parsed, education: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="学历"
                value={ed.degree}
                onChange={(e) => {
                  const next = [...parsed.education];
                  next[i] = { ...ed, degree: e.target.value };
                  onParsedChange({ ...parsed, education: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="专业"
                value={ed.major}
                onChange={(e) => {
                  const next = [...parsed.education];
                  next[i] = { ...ed, major: e.target.value };
                  onParsedChange({ ...parsed, education: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="在读/毕业时间"
                value={ed.period}
                onChange={(e) => {
                  const next = [...parsed.education];
                  next[i] = { ...ed, period: e.target.value };
                  onParsedChange({ ...parsed, education: next });
                }}
              />
            </div>
            <Textarea
              placeholder="亮点，每行一条"
              value={ed.highlights.join("\n")}
              onChange={(e) => {
                const next = [...parsed.education];
                next[i] = {
                  ...ed,
                  highlights: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                };
                onParsedChange({ ...parsed, education: next });
              }}
              className="min-h-[56px] text-xs"
            />
          </div>
        ))}

        <p className="text-xs font-medium text-text-muted pt-1">技能（每行一项）</p>
        <Textarea
          value={parsed.skills.join("\n")}
          onChange={(e) =>
            onParsedChange({
              ...parsed,
              skills: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="min-h-[64px] text-xs"
        />
        <p className="text-xs font-medium text-text-muted">语言（每行一项）</p>
        <Textarea
          value={parsed.languages.join("\n")}
          onChange={(e) =>
            onParsedChange({
              ...parsed,
              languages: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="min-h-[48px] text-xs"
        />
        <p className="text-xs font-medium text-text-muted">荣誉（每行一项）</p>
        <Textarea
          value={parsed.awards.join("\n")}
          onChange={(e) =>
            onParsedChange({
              ...parsed,
              awards: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="min-h-[48px] text-xs"
        />
      </div>

      <details className="rounded-lg border border-dashed border-border-custom bg-subtle/30 px-3 py-2">
        <summary className="text-xs font-medium text-text-muted cursor-pointer select-none">
          原始全文（调试）
        </summary>
        <Textarea
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          placeholder="上传文件后会自动填入并识别；也可在此粘贴原文后自行编辑上方各栏。"
          className="mt-2 min-h-[120px] text-xs resize-y"
        />
      </details>

      <p className="text-xs text-text-muted">
        {charHint || "上传文件成功后将自动识别并填入上方各栏；仅粘贴时请手动整理或编辑"}
      </p>

      <AlertDialog open={uploadOverwriteOpen} onOpenChange={setUploadOverwriteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>覆盖当前内容？</AlertDialogTitle>
            <AlertDialogDescription>
              你已填写部分简历信息或原始全文。继续上传将替换「原始全文」；若已有结构化内容，随后会询问是否用新原文重新识别。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingFile(null);
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingFile) void applyFile(pendingFile);
                setUploadOverwriteOpen(false);
              }}
            >
              继续上传
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={recognizeOverwriteOpen}
        onOpenChange={setRecognizeOverwriteOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>覆盖已填写的结构化信息？</AlertDialogTitle>
            <AlertDialogDescription>
              将根据当前「原始全文」重新解析并覆盖上方各分栏，已手动填写的内容将丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void executeParse()}>
              重新识别
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function SectionHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-custom first:border-t-0 first:pt-0">
      <p className="text-xs font-medium text-text-muted">{title}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-text-muted"
        onClick={onAdd}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        添加
      </Button>
    </div>
  );
}
