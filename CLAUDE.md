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


| Token                          | Value                                |
| ------------------------------ | ------------------------------------ |
| Text primary                   | #18181b                              |
| Text secondary                 | #3f3f46                              |
| Text muted                     | #71717a                              |
| BG page                        | #fafafa                              |
| BG card                        | #ffffff                              |
| BG subtle                      | #f4f4f5                              |
| Border                         | #e4e4e7                              |
| Accent (red, destructive only) | #dc2626                              |
| Border radius                  | 6px input, 8px card, 12px panel      |
| Spacing base                   | 4px (increments: 4/8/12/16/20/24/32) |
| Max width                      | 1280px                               |


## Key Constraints

- **No fabrication**: Every rewritten experience must have `originalExperience` traceability. Review agent checks this.
- **MVP: text only**: No image upload/OCR in first version. Text paste only.
- **AI provider flexible**: Use Vercel AI SDK provider abstraction. Default to one provider, env vars control model selection per step.
- **Chinese-first**: Default language zh, UI copy bilingual where needed. CJK rendering must work in PDF.
- **No auth**: Pure client-side localStorage persistence.
- **Minimal dependencies**: Don't add libraries unless clearly necessary.

## Resume writing & review (社招)

Full reference: **`docs/resumeExpertise.md`** (and screenshots under `社招简历撰写经验/`). The bullets below are the **compact rules** agents should follow by default; open the doc when editing prompts or needing examples.

### Core principles (compact)

- **Mindset (社招)**: Focus on **proven, verifiable outcomes** and immediate value—not “potential” filler. Work experience is **proof of professional value**, not a chronology, JD paste, or year-end self-review.
- **Bullet formula**: **Context/goal + your action + method or difficulty + outcome** (做什么 + 怎么做 + 做成什么). Every bullet should answer: what scenario, **what you owned**, how, and **measurable or verifiable result** (use relative change, ranges, or scope when exact numbers are not in source—**never invent metrics**).
- **Audience**: HR needs **match, clear trajectory, obvious output** in a skim. Hiring managers need **credible evidence** of judgment and ownership. Senior roles may emphasize systems, leadership, and cross-functional impact **only when supported by the user’s original material**.
- **JD alignment**: Reframe the **same facts** toward the target role’s competency model (product vs ops vs engineering vs PM); do not ship one generic version when JD is known.
- **Avoid**: Generic duty lines (“负责…日常/对接…”), running-account timelines, empty adjectives (“沟通强、抗压、认真负责”), actions with **no outcome**, **fake or decorative numbers**, burying the lead in trivia, vague **“参与/协助”** without your slice of ownership, keyword stacks (tools/models) with no business link, subjective result fluff (“效果显著、领导认可”), claiming **team wins** as solely personal.
- **Require**: **Contribution over job description**; strong **ownership verbs** grounded in facts; **quant or verifiable** outcomes where the source allows; for projects, **dense structure**: background, **your role**, 2–4 key moves, results (and reuse/mechanism if stated). Large projects: **what / your part / your impact**—not just the brand name.
- **Volume (when structuring output)**: Most detail on **recent** roles; roughly **3–6** bullets per role; put **strongest evidence first** when ordering bullets.
- **Five self-checks** (rewrite + review): (1) Value or mere duty? (2) Is **your** seniority/ownership obvious? (3) Clear result or equivalent proof? (4) Supports **this** JD? (5) Could **any** candidate paste the same line—if yes, make it specific.

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