import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type Rtf2Text = {
  string: (
    input: string,
    cb: (err: Error | null, text?: string) => void
  ) => void;
};

const rtf2text = require("rtf2text") as Rtf2Text;

/**
 * `rtf-parser` writes \\u params with writeInt16LE. Many generators (e.g. macOS TextEdit)
 * emit BMP code points as unsigned decimals (32768–65535), which throws RangeError.
 * RTF spec uses signed 16-bit for the same code unit: map unsigned → signed.
 */
export function normalizeRtfUnicodeParams(rtf: string): string {
  return rtf.replace(/\\u(\d+)/g, (full, digits: string) => {
    const n = parseInt(digits, 10);
    if (n > 32767 && n <= 65535) {
      return `\\u${n - 65536}`;
    }
    return full;
  });
}

/**
 * Decode RTF bytes to plain text (formatting stripped).
 * Uses latin1 so byte values match RTF \'hh escapes.
 */
export function rtfBufferToPlainText(buf: Buffer): Promise<string> {
  const raw = buf.toString("latin1");
  const input = normalizeRtfUnicodeParams(raw);
  return new Promise((resolve, reject) => {
    rtf2text.string(input, (err, text) => {
      if (err) {
        reject(err);
        return;
      }
      const t = (text ?? "").replace(/\r\n/g, "\n").trim();
      resolve(t);
    });
  });
}
