import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getParseModel } from "@/lib/ai/provider";
import { parsedResumeSchema } from "@/lib/ai/schemas/resume";
import { parseResumePrompt } from "@/lib/ai/prompts/parse-resume";

export async function POST(req: NextRequest) {
  const { resumeText, language } = await req.json();

  const result = await generateObject({
    model: getParseModel(),
    schema: parsedResumeSchema,
    system: parseResumePrompt(language),
    prompt: resumeText,
  });

  return NextResponse.json(result.object);
}
