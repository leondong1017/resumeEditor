# Resume Generator — Product & Architecture Design Spec

## Context

Build a resume generator that takes a user's existing resume and a target job description, then uses AI to produce a tailored resume. The primary market is Chinese job seekers (with English resume support). The tool rewrites experiences to match JD requirements using STAR/PDCA frameworks while ensuring all content is based on real experiences — no fabrication. A separate AI review agent validates output quality.

## Confirmed Decisions

| Decision | Choice |
|----------|--------|
| Tech stack | Next.js App Router (full-stack) |
| UI framework | shadcn/ui, Tailwind CSS |
| Color palette | Black/white/gray + minimal red accents |
| AI integration | Multi-model abstraction layer (Vercel AI SDK) |
| Auth | None — pure local storage (localStorage) |
| PDF output | 2-3 fixed templates, Playwright server-side rendering |
| Company research | Deferred (not in MVP) |
| Deployment | Local development first |
| Target market | Chinese market primary, English resume support |

---

## 1. User Flow

```
Upload Page → Processing Page → Editor Page
```

### Page 1: Upload
- Split layout: left panel for resume input, right panel for JD input
- Each panel supports: image upload (drag & drop), text paste, or both
- Bottom controls: STAR/PDCA framework toggle, CN/EN language toggle
- Single "Generate" CTA button

### Page 2: Processing
- Linear step indicator showing pipeline progress in real-time
- Each step shows: status (pending/running/done), name, elapsed time
- Steps: Parse Resume → Analyze JD → Match & Rewrite → Generate Strengths → Write Intro → Quality Review

### Page 3: Editor
- Split view: editable content (left), live PDF preview (right)
- Left panel sections (each independently regenerable):
  - Three-line intro card (highlighted, for recruitment app bios)
  - Personal summary
  - Work experience (STAR/PDCA formatted)
  - Project experience
  - Education
  - Skills & languages
  - Awards
- Template selector in toolbar (Classic / Modern / Tech)
- Review Agent feedback displayed as inline badges (error/warning/suggestion)
- Actions: Download PDF, Regenerate All, Regenerate Section

---

## 2. Data Model

```typescript
interface Resume {
  meta: {
    id: string
    createdAt: string
    updatedAt: string
    language: 'zh' | 'en'
    template: 'classic' | 'modern' | 'tech'
    framework: 'star' | 'pdca'
  }

  source: {
    resumeText: string
    resumeImageBase64?: string
    jdText: string
    jdImageBase64?: string
  }

  analysis: {
    parsedResume: ParsedResume
    jdAnalysis: JDAnalysis
    matchResult: MatchResult
    reviewFeedback?: ReviewFeedback
  }

  output: {
    basicInfo: {
      name: string
      phone?: string
      email?: string
      location?: string
      linkedin?: string
      website?: string
    }
    summary: string
    threeLineIntro: string
    experiences: WorkExperience[]
    projects: ProjectExperience[]
    education: Education[]
    skills: string[]
    languages?: string[]
    awards?: string[]
  }
}

interface WorkExperience {
  company: string
  title: string
  startDate: string
  endDate: string
  description: string        // STAR/PDCA formatted
  originalExperience: string // Source text for traceability
}

interface ProjectExperience {
  name: string
  role: string
  period: string
  description: string
  originalExperience: string
}

interface Education {
  school: string
  degree: string
  major: string
  period: string
  highlights?: string[]
}

interface JDAnalysis {
  companyName: string
  roleName: string
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  keywords: string[]
  seniorityLevel: string
}

interface MatchResult {
  overallScore: number       // 0-100
  matchedSkills: string[]
  gapSkills: string[]
  matchedExperiences: Array<{
    jdRequirement: string
    userExperience: string
    relevanceScore: number
  }>
}

interface ReviewFeedback {
  items: Array<{
    section: string
    severity: 'error' | 'warning' | 'suggestion'
    message: string
    originalText?: string
    suggestedText?: string
  }>
  overallAssessment: string
}
```

Key design points:
- `source` preserves raw input for regeneration
- `analysis` stores AI intermediate results for debugging and incremental updates
- `output` maps directly to PDF template rendering
- `originalExperience` in each work/project entry enables traceability (no fabrication check)

---

## 3. AI Pipeline Architecture

Sequential pipeline using Vercel AI SDK `generateObject` / `streamObject` with Zod schema validation.

### Pipeline Steps

| Step | Parallel Group | Model Tier | Input | Output | Streaming |
|------|---------------|------------|-------|--------|-----------|
| 1. parseResume | A (parallel with step 2) | Light (Haiku/GPT-4o-mini) | Raw text or image | ParsedResume | No |
| 2. analyzeJD | A (parallel with step 1) | Light | JD text or image | JDAnalysis | No |
| 3. matchAndRewrite | B (depends on A) | Strong (Sonnet/GPT-4o) | ParsedResume + JDAnalysis + framework | MatchResult + WorkExperience[] + ProjectExperience[] | Yes (per experience) |
| 4. generateStrengths | C (parallel with step 5, depends on B) | Strong | MatchResult + JDAnalysis | summary string | No |
| 5. generateIntro | C (parallel with step 4, depends on B) | Strong | All context | threeLineIntro string | No |
| 6. reviewContent | D (depends on B+C) | Strong (different persona) | All output + source | ReviewFeedback | No |

### Execution Flow

```
Group A: Promise.all([parseResume(), analyzeJD()])
    ↓
Group B: matchAndRewrite()  // streamed to UI
    ↓
Group C: Promise.all([generateStrengths(), generateIntro()])
    ↓
Group D: reviewContent()
```

### Provider Abstraction

```typescript
// lib/ai/provider.ts
// Uses Vercel AI SDK's multi-provider support
// Config allows per-step model selection via environment variables:
//   AI_PARSE_MODEL=haiku
//   AI_REWRITE_MODEL=sonnet
//   AI_REVIEW_MODEL=sonnet
```

### Prompt Design Principles
- Each prompt receives only the data it needs (not the entire context)
- System prompts enforce: no fabrication, data-driven language, concise writing
- The review agent uses a distinct "strict editor / HR reviewer" persona
- Framework-specific instructions (STAR vs PDCA) are injected into the rewrite prompt
- Language parameter controls output language (zh/en)

---

## 4. PDF Generation

### Approach: Playwright Server-Side HTML-to-PDF

Templates are standard React components rendering HTML/CSS. Playwright (headless Chromium) renders them to PDF on the server.

### Why Playwright over @react-pdf/renderer
- Native CJK text rendering (critical for Chinese market)
- Full CSS support (Grid, Flexbox, @font-face, print media queries)
- Templates are regular HTML/CSS — fast to develop and preview in browser
- Same React components power both the editor preview and PDF output

### Template System

3 templates, each a React Server Component:

| Template | Description |
|----------|-------------|
| Classic | Single-column, traditional layout. Conservative, suitable for state-owned enterprises and traditional industries |
| Modern | Left sidebar (info/skills) + right main content. Suitable for internet/startup roles |
| Tech | Structured with clear section headers, monospace elements for tech skills. Suitable for engineering roles |

### Font Strategy
- Bundle Noto Sans SC subset (~2-4MB instead of full 20MB)
- Serve from `/public/fonts/` for local rendering
- Font loaded once during Playwright browser initialization

### PDF Generation Flow
1. Frontend sends resume data + template choice to `/api/pdf/generate`
2. Server renders the template React component to static HTML
3. Playwright navigates to the HTML, waits for fonts to load
4. `page.pdf()` generates A4 PDF with appropriate margins
5. PDF returned as blob for download

---

## 5. Project Structure

```
resumeEditor/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Upload page
│   ├── processing/page.tsx         # Pipeline progress
│   ├── editor/page.tsx             # Editor + preview
│   └── api/
│       ├── ai/
│       │   ├── parse-resume/route.ts
│       │   ├── analyze-jd/route.ts
│       │   ├── match-rewrite/route.ts
│       │   ├── gen-strengths/route.ts
│       │   ├── gen-intro/route.ts
│       │   ├── review/route.ts
│       │   └── pipeline/route.ts
│       └── pdf/
│           ├── generate/route.ts
│           └── preview/[template]/route.ts
├── components/
│   ├── ui/                         # shadcn/ui
│   ├── upload/
│   │   ├── ResumeInput.tsx
│   │   └── JDInput.tsx
│   ├── editor/
│   │   ├── SectionEditor.tsx
│   │   ├── TemplateSelector.tsx
│   │   ├── ReviewBadges.tsx
│   │   └── ThreeLineIntro.tsx
│   └── pdf/templates/
│       ├── classic.tsx
│       ├── modern.tsx
│       └── tech.tsx
├── lib/
│   ├── ai/
│   │   ├── provider.ts
│   │   ├── pipeline.ts
│   │   ├── schemas/
│   │   │   ├── resume.ts
│   │   │   ├── jd.ts
│   │   │   ├── rewrite.ts
│   │   │   ├── strengths.ts
│   │   │   ├── intro.ts
│   │   │   └── review.ts
│   │   └── prompts/
│   │       ├── parse-resume.ts
│   │       ├── analyze-jd.ts
│   │       ├── match-rewrite.ts
│   │       ├── gen-strengths.ts
│   │       ├── gen-intro.ts
│   │       └── review.ts
│   ├── pdf/
│   │   └── renderer.ts
│   └── store/
│       └── resume-store.ts
├── styles/globals.css
├── docs/design.md                  # Design system tokens
└── public/fonts/                   # Noto Sans SC subset
```

---

## 6. Design System

### Tokens (to be documented in `docs/design.md`)

| Token | Value |
|-------|-------|
| Font family | Inter (UI), Noto Sans SC (Chinese content) |
| Font sizes | 12px body, 14px emphasis, 16px heading, 24px page title |
| Colors - text | #18181b (primary), #3f3f46 (secondary), #71717a (muted), #a1a1aa (disabled) |
| Colors - bg | #fafafa (page), #ffffff (card), #f4f4f5 (subtle), #e4e4e7 (border) |
| Colors - accent | #dc2626 (red, warnings/destructive only) |
| Border radius | 6px (input), 8px (card), 12px (panel) |
| Spacing | 4px base unit, increments of 4/8/12/16/20/24/32 |
| Max content width | 1280px |
| Editor split | 50/50 |

### Principles
- Minimalist: no decorative elements, let content breathe
- Consistent: all spacing, sizing, color from tokens — no magic numbers
- Readable: sufficient contrast ratios (WCAG AA minimum)
- Professional: the app should feel as polished as the resumes it produces

---

## 7. Writing Rules (Enforced in Prompts)

1. **No fabrication**: Every experience must trace back to the user's original resume. The `originalExperience` field enables verification. The review agent specifically checks for this.

2. **Data-driven**: Encourage quantified results (percentages, dollar amounts, user counts, timeframes). Prompts instruct the AI to preserve existing numbers and ask for more where appropriate.

3. **Framework adherence**: STAR (Situation → Task → Action → Result) or PDCA (Plan → Do → Check → Act) — applied consistently to each experience entry. The framework is passed as a parameter to the rewrite prompt.

4. **Concise language**: Maximum 3-4 bullet points per experience. No filler words. Active voice. Start bullets with strong action verbs.

5. **JD alignment**: Keywords from the JD analysis are woven naturally into experience descriptions — not keyword-stuffed, but contextually integrated.

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AI fabricates content | High (defeats core principle) | Review agent + `originalExperience` traceability + prompt guardrails |
| Pipeline latency (15-25s) | Medium (user experience) | Stream intermediate results, show progress, allow early editing |
| Playwright Chromium size for future deployment | Low (deferred) | `@sparticuz/chromium` + `puppeteer-core`, or separate PDF microservice |
| CJK font subset missing characters | Medium | Use Noto Sans SC Regular + Bold subsets covering GB2312; fallback to system fonts |
| localStorage data loss | Low | Export/import JSON feature (future enhancement) |
| AI model API rate limits | Medium | Queue with retry + exponential backoff in pipeline orchestrator |

---

## 9. Future Enhancements (Not in MVP)

- Company research via web search API (Serper/Tavily)
- Resume version history with diff view
- Export/import resume data as JSON
- Multiple resume management
- Optional cloud sync with auth
- A/B testing different rewrites for same experience
- Interview preparation tips based on JD analysis
