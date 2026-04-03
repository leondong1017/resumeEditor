"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createEmptyResume, saveResume } from "@/lib/store/resume-store";

export default function UploadPage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [framework, setFramework] = useState<"star" | "pdca">("star");
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = resumeText.trim().length > 0 && jdText.trim().length > 0;

  function handleGenerate() {
    if (!canSubmit) return;
    setIsSubmitting(true);

    const resume = createEmptyResume(language, framework);
    resume.source.resumeText = resumeText.trim();
    resume.source.jdText = jdText.trim();
    saveResume(resume);

    router.push("/processing");
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[1280px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">
            AI 简历生成器
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            粘贴你的简历和目标职位描述，AI 将为你量身定制简历
          </p>
        </div>

        {/* Input panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Resume input */}
          <Card className="p-5">
            <label className="block text-sm font-medium text-text-secondary mb-3">
              你的简历
            </label>
            <Textarea
              placeholder="粘贴你的简历内容..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[400px] resize-none text-sm leading-relaxed"
            />
            <p className="mt-2 text-xs text-text-muted">
              {resumeText.length > 0
                ? `${resumeText.length} 字`
                : "支持中文或英文简历"}
            </p>
          </Card>

          {/* JD input */}
          <Card className="p-5">
            <label className="block text-sm font-medium text-text-secondary mb-3">
              目标职位描述 (JD)
            </label>
            <Textarea
              placeholder="粘贴目标职位的招聘描述..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="min-h-[400px] resize-none text-sm leading-relaxed"
            />
            <p className="mt-2 text-xs text-text-muted">
              {jdText.length > 0
                ? `${jdText.length} 字`
                : "包含职位要求、职责描述等"}
            </p>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-subtle border border-border-custom">
          <div className="flex items-center gap-6">
            {/* Framework toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">写作框架</span>
              <div className="flex rounded-md border border-border-custom overflow-hidden">
                <button
                  onClick={() => setFramework("star")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    framework === "star"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card-bg text-text-secondary hover:bg-subtle"
                  }`}
                >
                  STAR
                </button>
                <button
                  onClick={() => setFramework("pdca")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    framework === "pdca"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card-bg text-text-secondary hover:bg-subtle"
                  }`}
                >
                  PDCA
                </button>
              </div>
            </div>

            {/* Language toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">语言</span>
              <div className="flex rounded-md border border-border-custom overflow-hidden">
                <button
                  onClick={() => setLanguage("zh")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    language === "zh"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card-bg text-text-secondary hover:bg-subtle"
                  }`}
                >
                  中文
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    language === "en"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card-bg text-text-secondary hover:bg-subtle"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!canSubmit || isSubmitting}
            className="min-w-[160px]"
          >
            {isSubmitting ? "准备中..." : "生成简历"}
          </Button>
        </div>
      </div>
    </main>
  );
}
