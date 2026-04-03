import { chromium, type Browser } from "playwright";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function renderHTMLToPDF(html: string): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();

  await page.setContent(html, { waitUntil: "networkidle" });

  const pdf = await page.pdf({
    format: "A4",
    margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    printBackground: true,
  });

  await page.close();
  return Buffer.from(pdf);
}
