import type { BasicInfo } from "@/lib/types";

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Playwright/Chromium PDF 页眉 HTML（每页重复）。仅包含有值的字段，用 · 分隔。
 * 若三者皆空则返回 null（不启用页眉，保持默认上边距）。
 */
export function buildPdfRunningHeaderTemplate(basic: BasicInfo): string | null {
  const parts: string[] = [];
  const name = basic.name?.trim();
  const phone = basic.phone?.trim();
  const email = basic.email?.trim();
  if (name) parts.push(escapeHtmlText(name));
  if (phone) parts.push(escapeHtmlText(phone));
  if (email) parts.push(escapeHtmlText(email));
  if (parts.length === 0) return null;
  const line = parts.join(" · ");
  return `<div style="width:100%;box-sizing:border-box;padding:0 16mm 2mm;font-size:9pt;line-height:1.35;color:#3f3f46;text-align:center;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC',sans-serif;border-bottom:0.5px solid #e4e4e7;">${line}</div>`;
}
