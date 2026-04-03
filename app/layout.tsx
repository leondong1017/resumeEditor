import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Editor - AI 简历生成器",
  description: "AI-powered resume generator for the Chinese job market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-page font-sans">
        {children}
      </body>
    </html>
  );
}
