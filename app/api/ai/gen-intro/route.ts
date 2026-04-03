import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getRewriteModel } from "@/lib/ai/provider";
import { introSchema } from "@/lib/ai/schemas/intro";
import { genIntroPrompt } from "@/lib/ai/prompts/gen-intro";
import { JDAnalysis, MatchResult, WorkExperience } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { jdAnalysis, matchResult, experiences, language } = (await req.json()) as {
    jdAnalysis: JDAnalysis;
    matchResult: MatchResult;
    experiences: WorkExperience[];
    language: "zh" | "en";
  };

  const result = await generateObject({
    model: getRewriteModel(),
    schema: introSchema,
    system: genIntroPrompt(jdAnalysis, matchResult, experiences, language),
    prompt: "Write the three-line professional intro now.",
  });

  return NextResponse.json(result.object);
}
