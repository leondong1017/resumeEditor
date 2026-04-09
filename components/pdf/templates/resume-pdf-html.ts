import type { Resume } from "@/lib/types";
import { classicTemplate } from "./classic";
import { modernTemplate } from "./modern";
import { techTemplate } from "./tech";

export function resumePdfHtml(resume: Resume): string {
  switch (resume.meta.template) {
    case "modern":
      return modernTemplate(resume);
    case "tech":
      return techTemplate(resume);
    case "classic":
    default:
      return classicTemplate(resume);
  }
}
