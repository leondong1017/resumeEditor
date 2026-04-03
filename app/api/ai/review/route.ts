import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getReviewModel } from "@/lib/ai/provider";
import { reviewFeedbackSchema } from "@/lib/ai/schemas/review";
import { reviewPrompt } from "@/lib/ai/prompts/review";
import { Resume } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { resume } = (await req.json()) as { resume: Resume };

  const result = await generateObject({
    model: getReviewModel(),
    schema: reviewFeedbackSchema,
    system: reviewPrompt(resume),
    prompt: "Review this resume content now. Be thorough and constructive.",
  });

  return NextResponse.json(result.object);
}
