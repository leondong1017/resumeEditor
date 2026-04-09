import { chromium, type Browser } from "playwright";
import { maskFirstPageRunningHeader } from "@/lib/pdf/mask-first-page-header";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

const DEFAULT_MARGIN = {
  top: "18mm",
  right: "16mm",
  bottom: "18mm",
  left: "16mm",
} as const;

/** 启用页眉时略加大上边距，避免与正文顶格重叠 */
const MARGIN_WITH_HEADER = {
  top: "26mm",
  right: "16mm",
  bottom: "18mm",
  left: "16mm",
} as const;

export type RenderPdfOptions = {
  /** Playwright 每页页眉 HTML（内联样式） */
  headerTemplate?: string;
};

export async function renderHTMLToPDF(
  html: string,
  options?: RenderPdfOptions
): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const header = options?.headerTemplate?.trim();
  const useHeader = Boolean(header);

  const pdf = await page.pdf({
    format: "A4",
    margin: useHeader ? MARGIN_WITH_HEADER : DEFAULT_MARGIN,
    printBackground: true,
    displayHeaderFooter: useHeader,
    headerTemplate: useHeader ? header : undefined,
    footerTemplate: useHeader
      ? `<div style="width:100%;font-size:1px;"></div>`
      : undefined,
  });

  await page.close();
  const raw = Buffer.from(pdf);
  if (useHeader) {
    return await maskFirstPageRunningHeader(raw);
  }
  return raw;
}
