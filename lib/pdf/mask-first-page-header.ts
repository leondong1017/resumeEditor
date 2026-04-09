import { PDFDocument, rgb } from "pdf-lib";

/** 与 MARGIN_WITH_HEADER.top 一致，略加大以盖住底部分隔线 */
const STRIP_MM = 28;

/**
 * Playwright 页眉会出现在每一页；用白块盖住首页顶部条带，使「姓名·电话·邮箱」仅从第 2 页起可见。
 */
export async function maskFirstPageRunningHeader(pdf: Buffer): Promise<Buffer> {
  const doc = await PDFDocument.load(pdf);
  const pages = doc.getPages();
  if (pages.length === 0) return pdf;

  const first = pages[0];
  const { width, height } = first.getSize();
  const stripPt = STRIP_MM * 2.834645669;

  first.drawRectangle({
    x: 0,
    y: height - stripPt,
    width,
    height: stripPt,
    color: rgb(1, 1, 1),
  });

  const out = await doc.save();
  return Buffer.from(out);
}
