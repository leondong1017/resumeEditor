import { NextRequest, NextResponse } from "next/server";
import { renderHTMLToPDF } from "@/lib/pdf/renderer";
import { resumePdfHtml } from "@/components/pdf/templates/resume-pdf-html";
import { buildPdfRunningHeaderTemplate } from "@/lib/pdf/pdf-running-header";
import {
  buildResumePdfFilename,
  contentDispositionWithUtf8Filename,
} from "@/lib/pdf/pdf-filename";
import type { Resume } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { resume } = (await req.json()) as { resume: Resume };

    const html = resumePdfHtml(resume);

    const headerTemplate =
      buildPdfRunningHeaderTemplate(resume.output.basicInfo) ?? undefined;
    const pdfBuffer = await renderHTMLToPDF(html, { headerTemplate });

    const filename = buildResumePdfFilename(resume);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDispositionWithUtf8Filename(filename),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
