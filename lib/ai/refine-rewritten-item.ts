import { generateObject } from "ai";
import { getParseModel, getRewriteModel } from "@/lib/ai/provider";
import {
  narrowKeywordPatchPrompt,
  rewriteSingleItemPrompt,
} from "@/lib/ai/prompts/match-rewrite";
import { inlineReviewPrompt } from "@/lib/ai/prompts/inline-review";
import {
  workExperienceSchema,
  projectExperienceSchema,
  narrowPatchDescriptionSchema,
} from "@/lib/ai/schemas/rewrite";
import { inlineReviewSchema } from "@/lib/ai/schemas/inline-review";
import type { JDRewriteBrief } from "@/lib/ai/jd-rewrite-brief";
import type { ProjectExperience, WorkExperience } from "@/lib/types";
import { stripMarkdownFromExperience } from "@/lib/resume/strip-markdown";
import type { z } from "zod";

type InlineReview = z.infer<typeof inlineReviewSchema>;

/**
 * Inline review (light model) + targeted second step: full rewrite if fabrication issues,
 * else narrow keyword patch. Rewrites use the strong model.
 */
export async function refineRewrittenItem(params: {
  parsedItem: Record<string, unknown>;
  rewritten: WorkExperience | ProjectExperience;
  type: "work" | "project";
  jdBrief: JDRewriteBrief;
  framework: "star" | "pdca";
  language: "zh" | "en";
  matchHints?: string;
}): Promise<{
  finalResult: WorkExperience | ProjectExperience;
  inlineReview: InlineReview;
}> {
  const {
    parsedItem,
    rewritten,
    type,
    jdBrief,
    framework,
    language,
    matchHints,
  } = params;

  const schema =
    type === "work" ? workExperienceSchema : projectExperienceSchema;

  let finalResult: WorkExperience | ProjectExperience = rewritten;

  const reviewOnce = async (original: string, desc: string) =>
    generateObject({
      model: getParseModel(),
      schema: inlineReviewSchema,
      system: inlineReviewPrompt(original, desc, jdBrief, language),
      prompt: "Check this rewritten experience now.",
    }).then((r) => r.object);

  let inlineReview = await reviewOnce(
    finalResult.originalExperience,
    finalResult.description
  );

  if (inlineReview.passed) {
    return {
      finalResult: stripMarkdownFromExperience(finalResult),
      inlineReview,
    };
  }

  if (!inlineReview.fabricationOk) {
    const retryResult = await generateObject({
      model: getRewriteModel(),
      schema,
      system: rewriteSingleItemPrompt(
        parsedItem,
        jdBrief,
        framework,
        language,
        type,
        {
          matchHints,
          reviewFeedback: `${inlineReview.message} (fabrication issues)`,
        }
      ),
      prompt: "Rewrite this experience again, addressing the review feedback above.",
    });
    finalResult = retryResult.object as WorkExperience | ProjectExperience;
    inlineReview = await reviewOnce(
      finalResult.originalExperience,
      finalResult.description
    );
    return {
      finalResult: stripMarkdownFromExperience(finalResult),
      inlineReview,
    };
  }

  const missing = inlineReview.missingKeywords;
  if (missing.length === 0) {
    return {
      finalResult: stripMarkdownFromExperience(finalResult),
      inlineReview,
    };
  }

  const patchResult = await generateObject({
    model: getParseModel(),
    schema: narrowPatchDescriptionSchema,
    system: narrowKeywordPatchPrompt(
      finalResult.originalExperience,
      finalResult.description,
      missing,
      jdBrief,
      language
    ),
    prompt: "Return the revised description only (3-4 bullets, • prefix).",
  });

  finalResult = {
    ...finalResult,
    description: patchResult.object.description,
  };
  inlineReview = await reviewOnce(
    finalResult.originalExperience,
    finalResult.description
  );

  return {
    finalResult: stripMarkdownFromExperience(finalResult),
    inlineReview,
  };
}
