import type { Resume } from "@/lib/types";

/** Definition A: at least one successful review run (errors in feedback still count). */
export function canDownloadPdf(resume: Resume): boolean {
  return Boolean(resume.analysis.reviewCompletedAt);
}
