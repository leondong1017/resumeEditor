import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getParseModel } from "@/lib/ai/provider";
import { jdAnalysisSchema } from "@/lib/ai/schemas/jd";
import { analyzeJDPrompt } from "@/lib/ai/prompts/analyze-jd";

export async function POST(req: NextRequest) {
  const { jdText, language } = await req.json();

  const result = await generateObject({
    model: getParseModel(),
    schema: jdAnalysisSchema,
    system: analyzeJDPrompt(language),
    prompt: jdText,
  });

  return NextResponse.json(result.object);
}
