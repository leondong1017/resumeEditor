/** 与 /api/extract-text 一致：首页客户端上传 .pdf / .txt / .rtf */

export const MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024;

const EXT_ERR = "仅支持 .pdf、.txt 与 .rtf";
const SIZE_ERR = "文件超过 5MB 限制";

function assertFileAllowed(file: File): void {
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    throw new Error(SIZE_ERR);
  }
  const lower = file.name.toLowerCase();
  if (
    !lower.endsWith(".pdf") &&
    !lower.endsWith(".txt") &&
    !lower.endsWith(".rtf")
  ) {
    throw new Error(EXT_ERR);
  }
}

function readTxtFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("读取失败"));
    r.readAsText(file, "UTF-8");
  });
}

export async function extractTextFromFile(file: File): Promise<string> {
  assertFileAllowed(file);
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".txt")) {
    return (await readTxtFile(file)).trim();
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/extract-text", { method: "POST", body: fd });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "文件提取失败");
  }
  return (data.text ?? "").trim();
}

export function validateUploadFileMeta(file: File): string | null {
  if (file.size > MAX_UPLOAD_FILE_BYTES) return SIZE_ERR;
  const lower = file.name.toLowerCase();
  if (
    !lower.endsWith(".pdf") &&
    !lower.endsWith(".txt") &&
    !lower.endsWith(".rtf")
  ) {
    return EXT_ERR;
  }
  return null;
}
