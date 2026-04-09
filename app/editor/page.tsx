"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadResume, saveResume } from "@/lib/store/resume-store";
import { canDownloadPdf } from "@/lib/review/download-guard";
import { SectionEditor } from "@/components/editor/SectionEditor";
import { PDFPreview } from "@/components/editor/PDFPreview";
import type { Resume } from "@/lib/types";
import {
  stripMarkdownBoldMarkers,
  stripMarkdownFromExperience,
} from "@/lib/resume/strip-markdown";
import { buildResumePdfFilename } from "@/lib/pdf/pdf-filename";

export default function EditorPage() {
  const router = useRouter();
  const [resume, setResume] = useState<Resume | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [editorTab, setEditorTab] = useState("intro");

  useEffect(() => {
    const data = loadResume();
    if (!data || !data.output.basicInfo.name) {
      router.replace("/");
      return;
    }
    setResume(data);
  }, [router]);

  function handleUpdate(updated: Resume) {
    setResume(updated);
    saveResume(updated);
  }

  async function handleRegenerateSection(section: string) {
    if (!resume) return;
    setRegenerating(section);

    try {
      // For now, re-run the specific section API
      const endpoint = getSectionEndpoint(section);
      if (!endpoint) return;

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(endpoint.body(resume)),
      });

      if (!response.ok) throw new Error("Regeneration failed");

      const data = await response.json();
      const updated = applySectionData(resume, section, data);
      handleUpdate(updated);
    } catch (err) {
      console.error("Regeneration error:", err);
    } finally {
      setRegenerating(null);
    }
  }

  async function handleDownloadPDF() {
    if (!resume) return;
    setDownloading(true);

    try {
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });

      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildResumePdfFilename(resume);
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setDownloading(false);
    }
  }

  if (!resume) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-text-muted">加载中...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border-custom bg-card-bg">
        <div className="flex">
          <div className="w-1/2 px-6 py-3 flex items-center gap-3 border-r border-border-custom">
            <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="icon-lg" className="shrink-0" />
                }
              >
                <ArrowLeft className="h-4 w-4" />
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>确认离开？</AlertDialogTitle>
                  <AlertDialogDescription>
                    当前编辑内容已自动保存，你可以随时返回继续编辑。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowLeaveDialog(false);
                      router.push("/");
                    }}
                  >
                    确认离开
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <h2 className="text-sm font-semibold text-text-primary truncate">
              {resume.output.basicInfo.name} 的简历
            </h2>
          </div>

          <div className="w-1/2 px-6 py-3 flex items-center justify-end gap-3">
            <Tabs
              value={resume.meta.template}
              onValueChange={(v) => {
                const updated = {
                  ...resume,
                  meta: { ...resume.meta, template: v as Resume["meta"]["template"] },
                };
                setResume(updated);
                saveResume(updated);
              }}
            >
              <TabsList>
                <TabsTrigger value="classic">经典</TabsTrigger>
                <TabsTrigger value="modern">现代</TabsTrigger>
                <TabsTrigger value="tech">技术</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              size="lg"
              onClick={() => {
                if (!canDownloadPdf(resume)) {
                  setShowDownloadGate(true);
                  return;
                }
                void handleDownloadPDF();
              }}
              disabled={downloading}
            >
              {downloading ? "生成中..." : "下载 PDF"}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDownloadGate} onOpenChange={setShowDownloadGate}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>需要先完成质量审核</AlertDialogTitle>
            <AlertDialogDescription>
              请先在左侧打开「质量审核」标签，完成一次 AI
              审核后即可下载 PDF。审核通过与否不影响下载，只需成功跑完一次流程。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditorTab("review");
                setShowDownloadGate(false);
              }}
            >
              前往质量审核
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 overflow-y-auto p-6 border-r border-border-custom">
          <SectionEditor
            resume={resume}
            onUpdate={handleUpdate}
            onRegenerateSection={handleRegenerateSection}
            regenerating={regenerating}
            editorTab={editorTab}
            onEditorTabChange={setEditorTab}
          />
        </div>

        <div className="w-1/2 overflow-y-auto p-6 bg-subtle">
          <PDFPreview resume={resume} />
        </div>
      </div>
    </main>
  );
}

function getSectionEndpoint(section: string) {
  const endpoints: Record<
    string,
    { url: string; body: (r: Resume) => unknown }
  > = {
    threeLineIntro: {
      url: "/api/ai/gen-intro",
      body: (r) => ({
        jdAnalysis: r.analysis.jdAnalysis,
        matchResult: r.analysis.matchResult,
        experiences: r.output.experiences,
        language: r.meta.language,
      }),
    },
    summary: {
      url: "/api/ai/gen-strengths",
      body: (r) => ({
        jdAnalysis: r.analysis.jdAnalysis,
        matchResult: r.analysis.matchResult,
        language: r.meta.language,
      }),
    },
    experiences: {
      url: "/api/ai/match-rewrite",
      body: (r) => ({
        parsedResume: r.analysis.parsedResume,
        jdAnalysis: r.analysis.jdAnalysis,
        framework: r.meta.framework,
        language: r.meta.language,
      }),
    },
    projects: {
      url: "/api/ai/match-rewrite",
      body: (r) => ({
        parsedResume: r.analysis.parsedResume,
        jdAnalysis: r.analysis.jdAnalysis,
        framework: r.meta.framework,
        language: r.meta.language,
      }),
    },
  };

  return endpoints[section] || null;
}

function applySectionData(
  resume: Resume,
  section: string,
  data: Record<string, unknown>
): Resume {
  const updated = { ...resume, output: { ...resume.output } };

  switch (section) {
    case "threeLineIntro":
      updated.output.threeLineIntro = stripMarkdownBoldMarkers(
        (data as { threeLineIntro: string }).threeLineIntro
      );
      break;
    case "summary":
      updated.output.summary = stripMarkdownBoldMarkers(
        (data as { summary: string }).summary
      );
      break;
    case "experiences":
    case "projects": {
      const rewrite = data as {
        experiences: Resume["output"]["experiences"];
        projects: Resume["output"]["projects"];
      };
      updated.output.experiences =
        rewrite.experiences.map(stripMarkdownFromExperience);
      updated.output.projects =
        rewrite.projects.map(stripMarkdownFromExperience);
      break;
    }
  }

  return updated;
}
