"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loadResume, saveResume } from "@/lib/store/resume-store";
import { SectionEditor } from "@/components/editor/SectionEditor";
import { PDFPreview } from "@/components/editor/PDFPreview";
import type { Resume } from "@/lib/types";

export default function EditorPage() {
  const router = useRouter();
  const [resume, setResume] = useState<Resume | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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
      setResume(updated);
      saveResume(updated);
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
      a.download = `${resume.output.basicInfo.name || "resume"}_${resume.meta.language}.pdf`;
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
      <div className="border-b border-border-custom bg-card-bg px-4 py-3">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              新建
            </Button>
            <h2 className="text-sm font-medium text-text-primary">
              {resume.output.basicInfo.name} 的简历
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Template selector */}
            <div className="flex rounded-md border border-border-custom overflow-hidden">
              {(["classic", "modern", "tech"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    const updated = {
                      ...resume,
                      meta: { ...resume.meta, template: t },
                    };
                    setResume(updated);
                    saveResume(updated);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    resume.meta.template === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-card-bg text-text-secondary hover:bg-subtle"
                  }`}
                >
                  {t === "classic" ? "经典" : t === "modern" ? "现代" : "技术"}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? "生成中..." : "下载 PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 overflow-y-auto p-6 border-r border-border-custom">
          <SectionEditor
            resume={resume}
            onUpdate={handleUpdate}
            onRegenerateSection={handleRegenerateSection}
            regenerating={regenerating}
          />
        </div>

        {/* Right: Preview */}
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
      updated.output.threeLineIntro = (data as { threeLineIntro: string }).threeLineIntro;
      break;
    case "summary":
      updated.output.summary = (data as { summary: string }).summary;
      break;
    case "experiences":
    case "projects": {
      const rewrite = data as {
        experiences: Resume["output"]["experiences"];
        projects: Resume["output"]["projects"];
      };
      updated.output.experiences = rewrite.experiences;
      updated.output.projects = rewrite.projects;
      break;
    }
  }

  return updated;
}
