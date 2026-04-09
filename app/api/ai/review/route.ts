import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getReviewModel } from "@/lib/ai/provider";
import { reviewPrompt } from "@/lib/ai/prompts/review";
import { parseReviewFeedbackFromModelText } from "@/lib/ai/parse-review-response";
import type { Resume, ReviewFeedback } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { resume } = (await req.json()) as { resume: Resume };

    const result = await generateText({
      model: getReviewModel(),
      system: reviewPrompt(resume),
      prompt: `Review this resume content now. Be thorough and constructive.

Return ONLY one JSON object with keys "items" (array) and "overallAssessment" (string), matching the schema described in the system message.
Do not use markdown code fences; do not add any text before or after the JSON.`,
      temperature: 0.2,
      maxOutputTokens: 8192,
    });

    const candidates = [
      result.text?.trim() ?? "",
      result.reasoningText?.trim() ?? "",
    ].filter((s) => s.length > 0);

    if (candidates.length === 0) {
      return NextResponse.json({ error: "模型未返回内容" }, { status: 502 });
    }

    let parsed: ReviewFeedback | undefined;
    let lastErr: unknown;
    const tried = new Set<string>();
    for (const raw of candidates) {
      if (tried.has(raw)) continue;
      tried.add(raw);
      try {
        parsed = parseReviewFeedbackFromModelText(raw);
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!parsed) {
      console.error(
        "[api/ai/review] parse failed",
        lastErr,
        candidates[0]?.slice(0, 800)
      );
      const msg =
        lastErr instanceof Error ? lastErr.message : "审核结果解析失败";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/ai/review]", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
