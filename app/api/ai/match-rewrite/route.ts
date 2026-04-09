import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getRewriteModel } from "@/lib/ai/provider";
import { rewriteResultSchema } from "@/lib/ai/schemas/rewrite";
import { matchRewritePrompt } from "@/lib/ai/prompts/match-rewrite";
import { ParsedResume, JDAnalysis } from "@/lib/types";
import { stripMarkdownFromExperience } from "@/lib/resume/strip-markdown";

export async function POST(req: NextRequest) {
  const { parsedResume, jdAnalysis, framework, language } = (await req.json()) as {
    parsedResume: ParsedResume;
    jdAnalysis: JDAnalysis;
    framework: "star" | "pdca";
    language: "zh" | "en";
  };

  const result = await generateObject({
    model: getRewriteModel(),
    schema: rewriteResultSchema,
    system: matchRewritePrompt(parsedResume, jdAnalysis, framework, language),
    prompt: "Rewrite the candidate's experiences to match the target job description. Follow all rules strictly.",
  });

  const obj = result.object;
  return NextResponse.json({
    ...obj,
    experiences: obj.experiences.map(stripMarkdownFromExperience),
    projects: obj.projects.map(stripMarkdownFromExperience),
  });
}
