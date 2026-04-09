"use client";

import { useRef, useState } from "react";
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
  extractTextFromFile,
  validateUploadFileMeta,
} from "@/lib/upload/extract-client-file";
import { Upload } from "lucide-react";

interface JdSourcePanelProps {
  jdText: string;
  onJdTextChange: (t: string) => void;
}

export function JdSourcePanel({ jdText, onJdTextChange }: JdSourcePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  async function applyFile(file: File) {
    setExtractError(null);
    setExtracting(true);
    try {
      const trimmed = await extractTextFromFile(file);
      onJdTextChange(trimmed);
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
    if (jdText.trim().length > 0) {
      setPendingFile(file);
      setOverwriteOpen(true);
    } else {
      void applyFile(file);
    }
  }

  return (
    <Card className="p-5 flex flex-col gap-3 min-h-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <label className="text-sm font-medium text-text-secondary shrink-0">
          目标职位描述 (JD)
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
            disabled={extracting}
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

      <Textarea
        placeholder="粘贴目标职位的招聘描述，或上传文件自动填入…"
        value={jdText}
        onChange={(e) => onJdTextChange(e.target.value)}
        className="h-[min(400px,52vh)] min-h-[200px] resize-y overflow-y-auto text-sm leading-relaxed"
      />
      <p className="text-xs text-text-muted">
        {jdText.length > 0
          ? `${jdText.length} 字`
          : "包含职位要求、职责描述等"}
      </p>

      <AlertDialog open={overwriteOpen} onOpenChange={setOverwriteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>覆盖当前 JD 文本？</AlertDialogTitle>
            <AlertDialogDescription>
              右侧输入框已有内容。继续上传将用文件中的文字替换当前 JD。
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
                setOverwriteOpen(false);
              }}
            >
              继续上传
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
