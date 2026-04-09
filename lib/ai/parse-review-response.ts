import { reviewFeedbackSchema } from "@/lib/ai/schemas/review";
import type { ReviewFeedback } from "@/lib/types";

/**
 * 去掉行注释与块注释（仅在字符串外），避免模型在 JSON 里写 // 导致解析失败。
 */
function stripJsonComments(input: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (escape) {
      out += c;
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") {
        out += c;
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = false;
      }
      out += c;
      continue;
    }
    if (c === '"') {
      inString = true;
      out += c;
      continue;
    }
    if (c === "/" && input[i + 1] === "/") {
      i += 2;
      while (i < input.length && input[i] !== "\n" && input[i] !== "\r") {
        i++;
      }
      if (i < input.length && (input[i] === "\n" || input[i] === "\r")) {
        out += input[i];
      }
      continue;
    }
    if (c === "/" && input[i + 1] === "*") {
      i += 2;
      while (
        i < input.length - 1 &&
        !(input[i] === "*" && input[i + 1] === "/")
      ) {
        i++;
      }
      i++;
      continue;
    }
    out += c;
  }
  return out;
}

/** 去掉对象 / 数组末尾多余逗号 */
function stripTrailingCommas(input: string): string {
  let out = input;
  let prev = "";
  while (out !== prev) {
    prev = out;
    out = out.replace(/,(\s*[\]}])/g, "$1");
  }
  return out;
}

/**
 * 从文本中切出「第一个」与根 `{` 配对的 JSON 对象，忽略其后说明文字或第二个 JSON。
 * （用 lastIndexOf('}') 会在多段 `}` 或两段 JSON 时出错；整段 parse 会在 `}{` 或尾部废话时报
 * "Unexpected non-whitespace character after JSON"。）
 */
function extractFirstJsonObjectSubstring(input: string): string {
  const s = input.trim();
  const start = s.indexOf("{");
  if (start === -1) {
    throw new Error("响应中未找到 JSON 对象");
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }
  throw new Error("JSON 大括号未闭合");
}

function unwrapMarkdownFence(t: string): string {
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fence ? fence[1].trim() : t.trim();
}

/**
 * MiMo：最终回复在 message.content，推理在 reasoning_content（见官方 OpenAI 兼容文档）。
 * 模型仍可能带围栏、注释、或 JSON 后的说明文字 — 统一走「去围栏 → 去注释 → 取首对象 → 去尾逗号 → parse」。
 */
export function parseReviewFeedbackFromModelText(raw: string): ReviewFeedback {
  if (!raw.trim()) {
    throw new Error("模型返回为空");
  }

  let t = unwrapMarkdownFence(raw);
  t = stripJsonComments(t);
  const objectStr = extractFirstJsonObjectSubstring(t);
  const ready = stripTrailingCommas(stripJsonComments(objectStr));
  const parsed: unknown = JSON.parse(ready);
  return reviewFeedbackSchema.parse(parsed);
}
