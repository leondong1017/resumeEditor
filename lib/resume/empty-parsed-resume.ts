import type { ParsedResume } from "@/lib/types";

export function createEmptyParsedResume(): ParsedResume {
  return {
    basicInfo: { name: "" },
    experiences: [],
    projects: [],
    education: [],
    skills: [],
    languages: [],
    awards: [],
  };
}
