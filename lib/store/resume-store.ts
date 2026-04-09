import { Resume } from "@/lib/types";

const STORAGE_KEY = "resume-editor-data";

export function createEmptyResume(
  language: "zh" | "en",
  framework: "star" | "pdca"
): Resume {
  return {
    meta: {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language,
      template: "classic",
      framework,
    },
    source: {
      resumeText: "",
      jdText: "",
    },
    analysis: {
      parsedResume: null,
      jdAnalysis: null,
      matchResult: null,
      reviewFeedback: null,
      reviewCompletedAt: null,
      reviewedOutputHash: null,
    },
    output: {
      basicInfo: { name: "" },
      summary: "",
      threeLineIntro: "",
      experiences: [],
      projects: [],
      education: [],
      skills: [],
      languages: [],
      awards: [],
    },
  };
}

export function saveResume(resume: Resume): void {
  resume.meta.updatedAt = new Date().toISOString();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  }
}

function normalizeResume(r: Resume): Resume {
  return {
    ...r,
    analysis: {
      ...r.analysis,
      reviewCompletedAt: r.analysis.reviewCompletedAt ?? null,
      reviewedOutputHash: r.analysis.reviewedOutputHash ?? null,
    },
  };
}

export function loadResume(): Resume | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return normalizeResume(JSON.parse(data) as Resume);
  } catch {
    return null;
  }
}

export function clearResume(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
