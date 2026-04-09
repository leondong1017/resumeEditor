import { NextRequest } from "next/server";
import { generateObject } from "ai";
import { getParseModel, getRewriteModel } from "@/lib/ai/provider";
import { buildJdRewriteBrief } from "@/lib/ai/jd-rewrite-brief";
import { formatMatchHintsForItem } from "@/lib/ai/match-hints";
import { refineRewrittenItem } from "@/lib/ai/refine-rewritten-item";
import { parsedResumeSchema } from "@/lib/ai/schemas/resume";
import { jdAnalysisSchema } from "@/lib/ai/schemas/jd";
import {
  matchAnalysisSchema,
  workExperienceSchema,
  projectExperienceSchema,
  rewriteResultSchema,
} from "@/lib/ai/schemas/rewrite";
import { parseResumePrompt } from "@/lib/ai/prompts/parse-resume";
import { analyzeJDPrompt } from "@/lib/ai/prompts/analyze-jd";
import {
  matchAnalysisPrompt,
  matchRewritePrompt,
  rewriteSingleItemPrompt,
} from "@/lib/ai/prompts/match-rewrite";
import type {
  Resume,
  ParsedResume,
  JDAnalysis,
  WorkExperience,
  ProjectExperience,
} from "@/lib/types";
import { stripMarkdownFromResumeOutput } from "@/lib/resume/strip-markdown";

/** Single batch rewrite when few items — fewer HTTP round-trips; still runs per-item refine (review / patch). */
const BATCH_ITEM_THRESHOLD = 3;

type ItemJob = {
  parsed: Record<string, unknown>;
  type: "work" | "project";
  index: number;
  /** Pre-filled by batch rewrite when batch path succeeds */
  batchDraft?: WorkExperience | ProjectExperience;
};

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
        const jdBrief = buildJdRewriteBrief(jdAnalysis);

        send("parse-resume", "done", parsedResume);
        send("analyze-jd", "done", jdAnalysis);

        send("match-rewrite", "running");

        const totalItems =
          parsedResume.experiences.length + parsedResume.projects.length;

        const b1Result = (
          await generateObject({
            model: getParseModel(),
            schema: matchAnalysisSchema,
            system: matchAnalysisPrompt(parsedResume, jdAnalysis, language),
            prompt: "Analyze the match between candidate and role now.",
          })
        ).object;

        console.log(`[pipeline] B1 match-analysis done`);
        send("match-analyze", "done", {
          ...b1Result,
          total: totalItems,
        });

        const matched = b1Result.matchedExperiences;

        const jobs: ItemJob[] = [
          ...parsedResume.experiences.map((exp, i) => ({
            parsed: exp as Record<string, unknown>,
            type: "work" as const,
            index: i,
          })),
          ...parsedResume.projects.map((proj, i) => ({
            parsed: proj as Record<string, unknown>,
            type: "project" as const,
            index: i,
          })),
        ];

        if (
          jobs.length > 0 &&
          jobs.length <= BATCH_ITEM_THRESHOLD
        ) {
          const batch = (
            await generateObject({
              model: getRewriteModel(),
              schema: rewriteResultSchema,
              system: matchRewritePrompt(
                parsedResume,
                jdAnalysis,
                framework,
                language
              ),
              prompt:
                "Rewrite the candidate's experiences to match the target job description. Follow all rules strictly.",
            })
          ).object;

          const batchOk =
            batch.experiences.length === parsedResume.experiences.length &&
            batch.projects.length === parsedResume.projects.length;

          if (batchOk) {
            let wi = 0;
            let pi = 0;
            for (const j of jobs) {
              j.batchDraft =
                j.type === "work"
                  ? batch.experiences[wi++]
                  : batch.projects[pi++];
            }
            console.log(
              `[pipeline] batch rewrite OK (${jobs.length} items), refining per item...`
            );
          } else {
            console.warn(
              `[pipeline] batch length mismatch, falling back to per-item rewrite`
            );
          }
        }

        let completedItems = 0;

        async function runJob(j: ItemJob): Promise<WorkExperience | ProjectExperience> {
          const t0 = Date.now();
          const matchHints = formatMatchHintsForItem(j.parsed, j.type, matched);

          let rewritten: WorkExperience | ProjectExperience;

          if (j.batchDraft) {
            rewritten = j.batchDraft;
          } else {
            const schema =
              j.type === "work" ? workExperienceSchema : projectExperienceSchema;
            const rewriteResult = await generateObject({
              model: getRewriteModel(),
              schema,
              system: rewriteSingleItemPrompt(
                j.parsed,
                jdBrief,
                framework,
                language,
                j.type,
                { matchHints }
              ),
              prompt:
                "Rewrite this experience to match the target role. Follow all rules strictly.",
            });
            rewritten = rewriteResult.object as
              | WorkExperience
              | ProjectExperience;
          }

          const { finalResult, inlineReview } = await refineRewrittenItem({
            parsedItem: j.parsed,
            rewritten,
            type: j.type,
            jdBrief,
            framework,
            language,
            matchHints,
          });

          if (!inlineReview.passed) {
            console.log(
              `[pipeline]   ${j.type}[${j.index}] gate still not passed, shipping with warning`
            );
          }

          completedItems++;
          const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
          console.log(
            `[pipeline]   ${j.type}[${j.index}] done in ${elapsed}s (${completedItems}/${totalItems}) review=${inlineReview.passed}`
          );

          send("rewrite-progress", "done", {
            type: j.type,
            completed: completedItems,
            total: totalItems,
            data: finalResult,
            inlineReview: {
              passed: inlineReview.passed,
              message: inlineReview.message,
              missingKeywords: inlineReview.missingKeywords,
            },
          });

          return finalResult;
        }

        const outcomes = await Promise.all(jobs.map(runJob));

        const experiences = outcomes.slice(
          0,
          parsedResume.experiences.length
        ) as WorkExperience[];
        const projects = outcomes.slice(
          parsedResume.experiences.length
        ) as ProjectExperience[];

        console.log(`[pipeline] B2 all done`);

        const matchResult = {
          overallScore: b1Result.overallScore,
          matchedSkills: b1Result.matchedSkills,
          gapSkills: b1Result.gapSkills,
          matchedExperiences: b1Result.matchedExperiences,
          experiences,
          projects,
        };
        send("match-rewrite", "done", matchResult);

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
              overallScore: b1Result.overallScore,
              matchedSkills: b1Result.matchedSkills,
              gapSkills: b1Result.gapSkills,
              matchedExperiences: b1Result.matchedExperiences,
            },
            reviewFeedback: null,
            reviewCompletedAt: null,
            reviewedOutputHash: null,
          },
          output: stripMarkdownFromResumeOutput({
            basicInfo: parsedResume.basicInfo,
            summary: "",
            threeLineIntro: "",
            experiences,
            projects,
            education: parsedResume.education,
            skills: parsedResume.skills,
            languages: parsedResume.languages,
            awards: parsedResume.awards,
          }),
        };

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
