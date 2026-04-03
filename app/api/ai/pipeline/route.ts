import { NextRequest } from "next/server";
import { generateObject } from "ai";
import { getParseModel, getRewriteModel, getReviewModel } from "@/lib/ai/provider";
import { parsedResumeSchema } from "@/lib/ai/schemas/resume";
import { jdAnalysisSchema } from "@/lib/ai/schemas/jd";
import { rewriteResultSchema } from "@/lib/ai/schemas/rewrite";
import { strengthsSchema } from "@/lib/ai/schemas/strengths";
import { introSchema } from "@/lib/ai/schemas/intro";
import { reviewFeedbackSchema } from "@/lib/ai/schemas/review";
import { parseResumePrompt } from "@/lib/ai/prompts/parse-resume";
import { analyzeJDPrompt } from "@/lib/ai/prompts/analyze-jd";
import { matchRewritePrompt } from "@/lib/ai/prompts/match-rewrite";
import { genStrengthsPrompt } from "@/lib/ai/prompts/gen-strengths";
import { genIntroPrompt } from "@/lib/ai/prompts/gen-intro";
import { reviewPrompt } from "@/lib/ai/prompts/review";
import type { Resume, ParsedResume, JDAnalysis } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { resumeText, jdText, language, framework } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(step: string, status: string, data?: unknown) {
        const msg = JSON.stringify({ step, status, data });
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
      }

      try {
        // Group A: Parse resume + Analyze JD in parallel
        send("parse-resume", "running");
        send("analyze-jd", "running");

        const [parseResult, jdResult] = await Promise.all([
          generateObject({
            model: getParseModel(),
            schema: parsedResumeSchema,
            system: parseResumePrompt(language),
            prompt: resumeText,
          }),
          generateObject({
            model: getParseModel(),
            schema: jdAnalysisSchema,
            system: analyzeJDPrompt(language),
            prompt: jdText,
          }),
        ]);

        const parsedResume = parseResult.object as ParsedResume;
        const jdAnalysis = jdResult.object as JDAnalysis;

        send("parse-resume", "done", parsedResume);
        send("analyze-jd", "done", jdAnalysis);

        // Group B: Match & Rewrite
        send("match-rewrite", "running");

        const rewriteResult = await generateObject({
          model: getRewriteModel(),
          schema: rewriteResultSchema,
          system: matchRewritePrompt(parsedResume, jdAnalysis, framework, language),
          prompt: "Rewrite the candidate's experiences to match the target job description. Follow all rules strictly.",
        });

        const matchResult = rewriteResult.object;
        send("match-rewrite", "done", matchResult);

        // Group C: Generate strengths + intro in parallel
        send("gen-strengths", "running");
        send("gen-intro", "running");

        const [strengthsResult, introResult] = await Promise.all([
          generateObject({
            model: getRewriteModel(),
            schema: strengthsSchema,
            system: genStrengthsPrompt(jdAnalysis, matchResult, language),
            prompt: "Write the professional summary now.",
          }),
          generateObject({
            model: getRewriteModel(),
            schema: introSchema,
            system: genIntroPrompt(jdAnalysis, matchResult, matchResult.experiences, language),
            prompt: "Write the three-line professional intro now.",
          }),
        ]);

        send("gen-strengths", "done", strengthsResult.object);
        send("gen-intro", "done", introResult.object);

        // Assemble the resume for review
        const resume: Resume = {
          meta: {
            id: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            language,
            template: "classic",
            framework,
          },
          source: { resumeText, jdText },
          analysis: {
            parsedResume,
            jdAnalysis,
            matchResult: {
              overallScore: matchResult.overallScore,
              matchedSkills: matchResult.matchedSkills,
              gapSkills: matchResult.gapSkills,
              matchedExperiences: matchResult.matchedExperiences,
            },
            reviewFeedback: null,
          },
          output: {
            basicInfo: parsedResume.basicInfo,
            summary: strengthsResult.object.summary,
            threeLineIntro: introResult.object.threeLineIntro,
            experiences: matchResult.experiences,
            projects: matchResult.projects,
            education: parsedResume.education,
            skills: parsedResume.skills,
            languages: parsedResume.languages,
            awards: parsedResume.awards,
          },
        };

        // Group D: Review
        send("review", "running");

        const reviewResult = await generateObject({
          model: getReviewModel(),
          schema: reviewFeedbackSchema,
          system: reviewPrompt(resume),
          prompt: "Review this resume content now. Be thorough and constructive.",
        });

        resume.analysis.reviewFeedback = reviewResult.object;
        send("review", "done", reviewResult.object);

        // Send final assembled resume
        send("complete", "done", resume);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        send("error", "error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
