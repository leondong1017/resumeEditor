import { createOpenAI } from "@ai-sdk/openai";

const kimi = createOpenAI({
  baseURL: "https://api.moonshot.cn/v1",
  apiKey: process.env.MOONSHOT_API_KEY,
});

const LIGHT_MODEL = process.env.AI_PARSE_MODEL ?? "kimi-k2-turbo-preview";
const STRONG_MODEL = process.env.AI_REWRITE_MODEL ?? "kimi-k2.5";
const REVIEW_MODEL = process.env.AI_REVIEW_MODEL ?? "kimi-k2.5";

export function getParseModel() {
  return kimi(LIGHT_MODEL);
}

export function getRewriteModel() {
  return kimi(STRONG_MODEL);
}

export function getReviewModel() {
  return kimi(REVIEW_MODEL);
}
