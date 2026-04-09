import { stripMarkdownBoldMarkers } from "@/lib/resume/strip-markdown";

/**
 * PDF 使用 pre-line 时会如实渲染换行；模型有时在要点之间输出 \n\n，视觉上像多了一行空行。
 * 将连续空行压成单行换行，各段经历版式一致；并去掉 Markdown **（旧数据兼容）。
 */
export function normalizePdfMultiline(text: string): string {
  const t = text.replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n");
  return stripMarkdownBoldMarkers(t);
}
