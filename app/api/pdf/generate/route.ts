import { NextRequest, NextResponse } from "next/server";
import { renderHTMLToPDF } from "@/lib/pdf/renderer";
import { classicTemplate } from "@/components/pdf/templates/classic";
import type { Resume } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { resume } = (await req.json()) as { resume: Resume };

    // Select template based on meta
    const html = classicTemplate(resume);

    const pdfBuffer = await renderHTMLToPDF(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
