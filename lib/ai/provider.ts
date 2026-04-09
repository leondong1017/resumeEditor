import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const kimi = createOpenAI({
  baseURL: "https://api.moonshot.cn/v1",
  apiKey: process.env.MOONSHOT_API_KEY ?? "",
});

/**
 * Xiaomi MiMo — OpenAI Chat Completions 兼容。
 * 文档：https://platform.xiaomimimo.com/#/docs/api/chat/openai-api
 *
 * - 官方示例使用 `max_completion_tokens`；AI SDK 默认发 `max_tokens`，在此做字段映射。
 * - 默认关闭 strict `json_schema`（改用 `json_object`），与小米网关的 generateObject 更稳；
 *   若需 JSON Schema 模式可设环境变量 `MIMO_STRUCTURED_OUTPUTS=true`。
 * - 同时发送 `Authorization: Bearer`（apiKey）与 `api-key` 请求头，兼容文档中的两种认证写法。
 */
const mimoApiKey = process.env.MIMO_API_KEY?.trim();
const mimoBaseURL =
  process.env.MIMO_API_BASE_URL?.trim() || "https://api.xiaomimimo.com/v1";

function mapMimoRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  const b = { ...body };
  if (typeof b.max_tokens === "number") {
    b.max_completion_tokens = b.max_tokens;
    delete b.max_tokens;
  }
  return b;
}

const mimo = mimoApiKey
  ? createOpenAICompatible({
      name: "xiaomi-mimo",
      baseURL: mimoBaseURL,
      apiKey: mimoApiKey,
      headers: {
        "api-key": mimoApiKey,
      },
      supportsStructuredOutputs: process.env.MIMO_STRUCTURED_OUTPUTS === "true",
      transformRequestBody: mapMimoRequestBody,
    })
  : null;

const LIGHT_MODEL = process.env.AI_PARSE_MODEL ?? "kimi-k2-turbo-preview";
const STRONG_MODEL = process.env.AI_REWRITE_MODEL ?? "kimi-k2.5";
const REVIEW_MODEL_KIMI = process.env.AI_REVIEW_MODEL ?? "kimi-k2.5";
const REVIEW_MODEL_MIMO =
  process.env.MIMO_REVIEW_MODEL?.trim() || "mimo-v2-pro";

export function getParseModel() {
  return kimi.chat(LIGHT_MODEL);
}

export function getRewriteModel() {
  return kimi.chat(STRONG_MODEL);
}

/** Full-document review (`/api/ai/review`). Pipeline per-item gate uses `getParseModel` first for cost/latency; swap to this if light-model gates misfire. */
export function getReviewModel() {
  if (mimo) {
    return mimo.languageModel(REVIEW_MODEL_MIMO);
  }
  return kimi.chat(REVIEW_MODEL_KIMI);
}
