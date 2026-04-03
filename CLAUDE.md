# Resume Editor - Project Rules

## Background

AI-powered resume generator for the Chinese job market. User pastes resume + job description (JD), AI rewrites experiences to match JD requirements using STAR/PDCA frameworks. All content must trace back to real experiences — no fabrication.

## Tech Stack

- **Framework**: Next.js 15 App Router (full-stack)
- **UI**: shadcn/ui + Tailwind CSS v4
- **AI**: Vercel AI SDK (`ai` package) with multi-provider abstraction
- **State**: localStorage (no auth, no database)
- **PDF**: Playwright server-side HTML-to-PDF rendering
- **Language**: TypeScript strict mode
- **Package Manager**: npm
- **Font**: Noto Sans SC (Chinese), Inter (UI)

## Implementation Path (Core Loop First)

Phase 1 — MVP Core Loop:
1. Project scaffold (Next.js + shadcn/ui + Tailwind)
2. Upload page: text paste for resume + JD, framework/language toggles
3. AI pipeline API routes: parse → analyze → match & rewrite → generate strengths/intro → review
4. Processing page: step progress indicator
5. Editor page: section-based content display with regenerate per section
6. PDF preview and download (single template first)

Phase 2 — Polish:
7. All 3 PDF templates (Classic / Modern / Tech)
8. Review agent inline badges (error/warning/suggestion)
9. UI refinements, animations, edge cases

## Design Tokens

| Token | Value |
|-------|-------|
| Text primary | #18181b |
| Text secondary | #3f3f46 |
| Text muted | #71717a |
| BG page | #fafafa |
| BG card | #ffffff |
| BG subtle | #f4f4f5 |
| Border | #e4e4e7 |
| Accent (red, destructive only) | #dc2626 |
| Border radius | 6px input, 8px card, 12px panel |
| Spacing base | 4px (increments: 4/8/12/16/20/24/32) |
| Max width | 1280px |

## Key Constraints

- **No fabrication**: Every rewritten experience must have `originalExperience` traceability. Review agent checks this.
- **MVP: text only**: No image upload/OCR in first version. Text paste only.
- **AI provider flexible**: Use Vercel AI SDK provider abstraction. Default to one provider, env vars control model selection per step.
- **Chinese-first**: Default language zh, UI copy bilingual where needed. CJK rendering must work in PDF.
- **No auth**: Pure client-side localStorage persistence.
- **Minimal dependencies**: Don't add libraries unless clearly necessary.

## Project Structure

```
app/                    # Next.js App Router pages + API routes
  api/ai/              # AI pipeline endpoints
  api/pdf/             # PDF generation endpoints
components/
  ui/                  # shadcn/ui primitives
  upload/              # Upload page components
  editor/              # Editor page components
  pdf/templates/       # PDF template React components
lib/
  ai/                  # Provider config, pipeline orchestration
    schemas/           # Zod schemas for AI outputs
    prompts/           # Prompt templates per step
  pdf/                 # Playwright PDF renderer
  store/               # localStorage state management
```

## Coding Conventions

- Use `generateObject` / `streamObject` from Vercel AI SDK with Zod schemas for all AI calls
- API routes under `app/api/` use Route Handlers
- Components are client components only when they need interactivity; default to server components
- Prompts live in `lib/ai/prompts/` as exported functions, not inline strings
- Chinese comments are fine; code identifiers in English
- No `any` types. Use the data model interfaces from the spec.

## AI Pipeline

```
Group A (parallel): parseResume() + analyzeJD()
    ↓
Group B: matchAndRewrite()  — streamed
    ↓
Group C (parallel): generateStrengths() + generateIntro()
    ↓
Group D: reviewContent()
```

Light model (Haiku/mini) for parsing; strong model (Sonnet/4o) for rewriting and review.
Env vars: `AI_PARSE_MODEL`, `AI_REWRITE_MODEL`, `AI_REVIEW_MODEL`.
