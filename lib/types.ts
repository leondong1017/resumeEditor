export interface Resume {
  meta: {
    id: string;
    createdAt: string;
    updatedAt: string;
    language: "zh" | "en";
    template: "classic" | "modern" | "tech";
    framework: "star" | "pdca";
  };

  source: {
    resumeText: string;
    jdText: string;
  };

  analysis: {
    parsedResume: ParsedResume | null;
    jdAnalysis: JDAnalysis | null;
    matchResult: MatchResult | null;
    reviewFeedback: ReviewFeedback | null;
    /** ISO timestamp after a successful review API run (unlocks PDF). */
    reviewCompletedAt: string | null;
    /** Snapshot hash of `output` when review last completed; for stale UI hint only. */
    reviewedOutputHash: string | null;
  };

  output: {
    basicInfo: BasicInfo;
    summary: string;
    threeLineIntro: string;
    experiences: WorkExperience[];
    projects: ProjectExperience[];
    education: Education[];
    skills: string[];
    languages: string[];
    awards: string[];
  };
}

export interface BasicInfo {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  originalExperience: string;
}

export interface ProjectExperience {
  name: string;
  role: string;
  period: string;
  description: string;
  originalExperience: string;
}

export interface Education {
  school: string;
  degree: string;
  major: string;
  period: string;
  highlights: string[];
}

export interface ParsedResume {
  basicInfo: BasicInfo;
  experiences: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    role: string;
    period: string;
    description: string;
  }>;
  education: Education[];
  skills: string[];
  languages: string[];
  awards: string[];
}

export interface KeywordGroup {
  category: string;
  keywords: string[];
}

export interface JDAnalysis {
  companyName: string;
  roleName: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  seniorityLevel: string;
  keywordGroups: KeywordGroup[];
}

export interface MatchResult {
  overallScore: number;
  matchedSkills: string[];
  gapSkills: string[];
  matchedExperiences: Array<{
    jdRequirement: string;
    userExperience: string;
    relevanceScore: number;
  }>;
}

export interface ReviewFeedback {
  items: Array<{
    section: string;
    severity: "error" | "warning" | "suggestion";
    message: string;
    originalText?: string | null;
    suggestedText?: string | null;
  }>;
  overallAssessment: string;
}

export type PipelineStep = "parse-resume" | "analyze-jd" | "match-rewrite";

export interface PipelineStepStatus {
  step: PipelineStep;
  label: string;
  status: "pending" | "running" | "done" | "error";
  startedAt?: number;
  completedAt?: number;
  error?: string;
}
