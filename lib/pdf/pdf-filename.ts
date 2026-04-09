import type { Resume } from "@/lib/types";
import { estimateWorkExperienceYears } from "@/lib/pdf/estimate-work-years";

/**
 * 姓名 / 岗位等「展示段」：不出现下划线，仅段与段之间用 `_` 连接。
 * 非法文件名字符去掉；原下划线与空白统一为单个半角空格。
 */
export function sanitizePdfFilenameDisplayPart(s: string): string {
  return s
    .trim()
    .replace(/[\\/:*?"<>|\r\n\t]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** @deprecated 岗位/姓名请用 sanitizePdfFilenameDisplayPart，避免段内出现下划线 */
export function sanitizePdfFilenameSegment(s: string): string {
  return sanitizePdfFilenameDisplayPart(s).replace(/\s+/g, "_");
}

/**
 * 姓名_N年经验_目标岗位.pdf（缺姓名用「简历」，缺 JD 岗位用「目标岗位」）
 */
export function buildResumePdfFilename(resume: Resume): string {
  const name =
    sanitizePdfFilenameDisplayPart(resume.output.basicInfo.name || "") || "简历";
  const n = estimateWorkExperienceYears(resume.output.experiences);
  const roleRaw = resume.analysis.jdAnalysis?.roleName?.trim() || "";
  const role = sanitizePdfFilenameDisplayPart(roleRaw) || "目标岗位";
  return `${name}_${n}年经验_${role}.pdf`;
}

/** attachment 用 ASCII 回退名 + RFC5987 UTF-8 文件名 */
export function contentDispositionWithUtf8Filename(
  utf8Filename: string
): string {
  const ascii =
    utf8Filename
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 120) || "resume.pdf";
  const star = `UTF-8''${encodeURIComponent(utf8Filename)}`;
  return `attachment; filename="${ascii}"; filename*=${star}`;
}
