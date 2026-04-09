"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeSourcePanel } from "@/components/upload/ResumeSourcePanel";
import { JdSourcePanel } from "@/components/upload/JdSourcePanel";
import { createEmptyResume, saveResume } from "@/lib/store/resume-store";
import { createEmptyParsedResume } from "@/lib/resume/empty-parsed-resume";
import { buildResumeTextForPipeline } from "@/lib/resume/serialize-parsed-resume";
import type { ParsedResume } from "@/lib/types";

export function UploadPage() {
  const router = useRouter();
  const [resumeParsed, setResumeParsed] = useState<ParsedResume>(() =>
    createEmptyParsedResume()
  );
  const [resumeRawText, setResumeRawText] = useState("");
  const [jdText, setJdText] = useState("");
  const [framework, setFramework] = useState<"star" | "pdca">("star");
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resumeText = buildResumeTextForPipeline(resumeParsed, resumeRawText);
  const canSubmit = resumeText.length > 0 && jdText.trim().length > 0;

  function handleGenerate() {
    if (!canSubmit) return;
    setIsSubmitting(true);

    const resume = createEmptyResume(language, framework);
    resume.source.resumeText = resumeText;
    resume.source.jdText = jdText.trim();
    saveResume(resume);

    router.push("/processing");
  }

  return (
    <main className="flex-1 flex flex-col min-h-0">
      <header className="sticky top-0 z-40 border-b border-border-custom bg-card-bg/95 backdrop-blur-md supports-backdrop-filter:bg-card-bg/90">
        <div className="max-w-[1280px] mx-auto px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <h1 className="text-2xl font-semibold text-text-primary shrink-0">
            AI 简历生成器
          </h1>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 lg:justify-end">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-text-secondary whitespace-nowrap">
                写作框架
              </span>
              <Tabs
                value={framework}
                onValueChange={(v) => {
                  if (v === "star" || v === "pdca") setFramework(v);
                }}
              >
                <TabsList>
                  <TabsTrigger value="star" className="min-w-[4rem] px-3 text-xs sm:text-sm">
                    STAR
                  </TabsTrigger>
                  <TabsTrigger value="pdca" className="min-w-[4rem] px-3 text-xs sm:text-sm">
                    PDCA
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-text-secondary whitespace-nowrap">
                输出语言
              </span>
              <Tabs
                value={language}
                onValueChange={(v) => {
                  if (v === "zh" || v === "en") setLanguage(v);
                }}
              >
                <TabsList>
                  <TabsTrigger value="zh" className="min-w-[4rem] px-3 text-xs sm:text-sm">
                    中文
                  </TabsTrigger>
                  <TabsTrigger value="en" className="min-w-[4rem] px-3 text-xs sm:text-sm">
                    English
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!canSubmit || isSubmitting}
              className="w-full shrink-0 sm:w-auto"
            >
              {isSubmitting ? "准备中..." : "生成简历"}
            </Button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1280px] mx-auto px-4 py-6 flex-1 flex flex-col min-h-0">
        <p className="mb-6 text-center text-sm text-text-muted">
          简历与 JD 均支持上传 PDF / TXT / RTF；简历文件读取成功后会自动识别结构化字段
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start flex-1 min-h-0">
          <ResumeSourcePanel
            language={language}
            parsed={resumeParsed}
            rawText={resumeRawText}
            onParsedChange={setResumeParsed}
            onRawTextChange={setResumeRawText}
          />

          <JdSourcePanel jdText={jdText} onJdTextChange={setJdText} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-border-custom bg-page py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] mt-auto">
        <p className="text-center text-xs text-text-muted px-4">
          AI 生成内容请人工核对；数据仅存于本机浏览器，服务端不存储。
        </p>
      </footer>
    </main>
  );
}
