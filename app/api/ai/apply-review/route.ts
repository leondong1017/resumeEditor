import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getRewriteModel } from "@/lib/ai/provider";
import { resumeOutputSchema } from "@/lib/ai/schemas/resume-output";
import { applyReviewPrompt } from "@/lib/ai/prompts/apply-review";
import type { Resume } from "@/lib/types";
import { stripMarkdownFromResumeOutput } from "@/lib/resume/strip-markdown";

export async function POST(req: NextRequest) {
  try {
    const { resume } = (await req.json()) as { resume: Resume };

    if (!resume?.analysis?.reviewFeedback) {
      return NextResponse.json({ error: "缺少审核结果" }, { status: 400 });
    }

    const result = await generateObject({
      model: getRewriteModel(),
      schema: resumeOutputSchema,
      system: applyReviewPrompt(resume),
      prompt:
        "Return the revised full resume output as JSON matching the schema. Apply every review item.",
    });

    return NextResponse.json({
      output: stripMarkdownFromResumeOutput(result.object),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/ai/apply-review]", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
