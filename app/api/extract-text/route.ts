import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { rtfBufferToPlainText } from "@/lib/resume/rtf-to-plain-text";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "文件超过 5MB 限制" },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    const buf = Buffer.from(await file.arrayBuffer());

    if (name.endsWith(".txt")) {
      const text = buf.toString("utf8");
      return NextResponse.json({ text });
    }

    if (name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: new Uint8Array(buf) });
      try {
        const result = await parser.getText();
        const text = result.text?.trim() ?? "";
        if (!text) {
          return NextResponse.json(
            { error: "未能从 PDF 提取文字，可能是扫描件或加密文件" },
            { status: 422 }
          );
        }
        return NextResponse.json({ text });
      } finally {
        await parser.destroy();
      }
    }

    if (name.endsWith(".rtf")) {
      try {
        const text = await rtfBufferToPlainText(buf);
        if (!text) {
          return NextResponse.json(
            { error: "未能从 RTF 提取文字，文件可能损坏或非标准格式" },
            { status: 422 }
          );
        }
        return NextResponse.json({ text });
      } catch (e) {
        return NextResponse.json(
          {
            error:
              e instanceof Error
                ? `RTF 解析失败：${e.message}`
                : "RTF 解析失败",
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { error: "仅支持 .pdf、.txt 与 .rtf 文件" },
      { status: 400 }
    );
  } catch (e) {
    console.error("[extract-text]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "提取失败" },
      { status: 500 }
    );
  }
}
