import type { Resume } from "@/lib/types";

/** Deterministic short hash of output for stale-review detection (no crypto). */
export function hashResumeOutput(output: Resume["output"]): string {
  const str = JSON.stringify(output);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
