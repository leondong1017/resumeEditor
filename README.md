# Resume Editor

AI-assisted resume editor for the Chinese job market: paste your resume and a job description (JD), run a pipeline to parse, align, and rewrite content toward the JD (no fabrication — traceability to your source material). Export PDF with multiple templates.

Stack: Next.js (App Router), shadcn/ui, Tailwind CSS v4, Vercel AI SDK, Playwright for server-side HTML → PDF. State is persisted in the browser (`localStorage`); there is no built-in auth or database.

## Prerequisites

- Node.js 20+ recommended
- npm
- Playwright installs browser binaries on first PDF generation (handled by the `playwright` dependency)

## Environment variables (API keys)

**Do not commit real keys.** Use a local `.env.local` file (ignored by git) or your host’s secret store (e.g. Vercel Environment Variables).

1. Copy the template:

   ```bash
   cp .env.example .env.local
   ```

2. Set at least **`MOONSHOT_API_KEY`** from the [Moonshot / Kimi](https://platform.moonshot.cn/) console so parse and rewrite work.

### Default providers in this repository

The code in [`lib/ai/provider.ts`](lib/ai/provider.ts) is wired as follows:

- **Parse and rewrite** always call the **Moonshot (Kimi) OpenAI-compatible** endpoint (`https://api.moonshot.cn/v1`). A generic OpenAI key will **not** work without code changes.
- **Full-document review** uses **MiMo** when `MIMO_API_KEY` is set; otherwise it uses **Kimi** for review as well.

Optional variables are documented in [`.env.example`](.env.example). The `AI_PARSE_MODEL`, `AI_REWRITE_MODEL`, and `AI_REVIEW_MODEL` variables only select **model IDs on the Moonshot API** (or the MiMo path where applicable). They are **not** a universal switch to arbitrary cloud vendors.

### Using another vendor (OpenAI, Anthropic, other gateways)

This project does **not** ship a multi-provider switch. To use another provider you must **change the code** (e.g. adjust `provider.ts` to use the correct SDK, base URL, and auth headers) and verify that your models support the structured outputs used by the app (`generateObject` / JSON modes). The README only documents the **current default wiring**.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run lint
```

## Reference material

Resume-writing guidance for 社招 is summarized in [`docs/resumeExpertise.md`](docs/resumeExpertise.md). Optional screenshot references live under `社招简历撰写经验/` **locally**; that folder is gitignored to keep clones small—add your own copies if you use them.

## Security checklist before `git push`

- Never commit `.env`, `.env.local`, or any file containing API keys or tokens.
- Run a quick scan on staged changes, e.g. `git diff --cached`, and avoid force-adding ignored env files (`git add -f`).

## Publishing to GitHub

1. Create an empty repository on GitHub (no README/license if you already have them here).
2. From this project root:

   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git branch -M main
   git push -u origin main
   ```

   Use your SSH remote URL instead if you prefer SSH.

## License

See [LICENSE](LICENSE).
