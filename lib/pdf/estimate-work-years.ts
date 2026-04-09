import type { WorkExperience } from "@/lib/types";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function isPresentEnd(s: string): boolean {
  return /至今|现在|今|present|now|current/i.test(s.trim());
}

/**
 * 从 YYYY.MM / YYYY-MM / YYYY年M月 等解析为当月 1 日
 */
export function parseResumePeriodDate(s: string | undefined): Date | null {
  if (!s?.trim()) return null;
  const raw = s.trim();
  const m = raw.match(/(\d{4})\s*[./年-]\s*(\d{1,2})/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = Math.min(12, Math.max(1, parseInt(m[2], 10)));
    return new Date(y, mo - 1, 1);
  }
  const yOnly = raw.match(/^(\d{4})$/);
  if (yOnly) return new Date(parseInt(yOnly[1], 10), 0, 1);
  return null;
}

function parseExperienceStart(exp: WorkExperience): Date | null {
  const raw = exp.startDate?.trim() ?? "";
  const first = raw.split(/[–—\-~～至到]/)[0]?.trim() ?? raw;
  return parseResumePeriodDate(first);
}

function parseExperienceEnd(exp: WorkExperience): Date | null {
  const raw = exp.endDate?.trim() ?? "";
  /** 未填结束时间多表示仍在职 */
  if (!raw) return new Date();
  if (isPresentEnd(raw)) return new Date();
  const parts = raw.split(/[–—\-~～]/);
  const last = parts[parts.length - 1]?.trim();
  if (last && isPresentEnd(last)) return new Date();
  if (last) return parseResumePeriodDate(last);
  return parseResumePeriodDate(raw);
}

/**
 * 工作经历：最早入职 → 最晚离职（「至今」按当天），日历跨度折算年数，四舍五入。
 * 有跨度但不足 1 年按 1 年计。
 */
export function estimateWorkExperienceYears(
  experiences: WorkExperience[]
): number {
  if (experiences.length === 0) return 0;

  let minStart: Date | null = null;
  let maxEnd: Date | null = null;

  for (const exp of experiences) {
    const start = parseExperienceStart(exp);
    const end = parseExperienceEnd(exp);
    if (!start || !end) continue;
    if (end < start) continue;
    if (!minStart || start < minStart) minStart = start;
    if (!maxEnd || end > maxEnd) maxEnd = end;
  }

  if (!minStart || !maxEnd || maxEnd < minStart) return 0;

  const yearsFloat = (maxEnd.getTime() - minStart.getTime()) / MS_PER_YEAR;
  const rounded = Math.round(yearsFloat);
  if (rounded === 0 && yearsFloat > 0) return 1;
  return Math.max(0, rounded);
}
