import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getRewriteModel } from "@/lib/ai/provider";
import { strengthsSchema } from "@/lib/ai/schemas/strengths";
import { genStrengthsPrompt } from "@/lib/ai/prompts/gen-strengths";
import { JDAnalysis, MatchResult } from "@/lib/types";
import { stripMarkdownBoldMarkers } from "@/lib/resume/strip-markdown";

export async function POST(req: NextRequest) {
  const { jdAnalysis, matchResult, language } = (await req.json()) as {
    jdAnalysis: JDAnalysis;
    matchResult: MatchResult;
    language: "zh" | "en";
  };

  const result = await generateObject({
    model: getRewriteModel(),
    schema: strengthsSchema,
    system: genStrengthsPrompt(jdAnalysis, matchResult, language),
    prompt: "Write the professional summary now.",
  });

  return NextResponse.json({
    summary: stripMarkdownBoldMarkers(result.object.summary),
  });
}
