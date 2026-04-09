import type { MatchResult } from "@/lib/types";

/**
 * Pick JD↔resume mapping lines from B1 for this item so rewrites consume match analysis (not token-heavy full JSON).
 */
export function formatMatchHintsForItem(
  item: Record<string, unknown>,
  type: "work" | "project",
  matched: MatchResult["matchedExperiences"]
): string | undefined {
  if (!matched.length) return undefined;

  const desc = String(item.description ?? "").replace(/\s+/g, " ").trim();
  const primary =
    type === "work"
      ? `${item.company ?? ""} ${item.title ?? ""}`.toLowerCase()
      : `${item.name ?? ""} ${item.role ?? ""}`.toLowerCase();

  const chunks: string[] = [];

  for (const m of matched) {
    const u = m.userExperience.toLowerCase();
    const seed = primary.trim().slice(0, 14);
    const overlap =
      seed.length > 2 &&
      (u.includes(seed) ||
        primary
          .split(/\s+/)
          .some((t) => t.length > 1 && u.includes(t)));
    const descOverlap =
      desc.length > 15 &&
      desc
        .toLowerCase()
        .split(/[,，、\s]+/)
        .some((tok) => tok.length > 4 && u.includes(tok));
    if (overlap || descOverlap) {
      chunks.push(
        `- JD focus: ${m.jdRequirement} ↔ your material: ${m.userExperience} (relevance ${m.relevanceScore})`
      );
    }
  }

  if (chunks.length === 0) {
    return matched
      .slice(0, 3)
      .map(
        (m) =>
          `- JD focus: ${m.jdRequirement} ↔ ${m.userExperience} (${m.relevanceScore})`
      )
      .join("\n");
  }
  return chunks.join("\n");
}
