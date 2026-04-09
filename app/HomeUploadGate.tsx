"use client";

import dynamic from "next/dynamic";

const UploadPage = dynamic(
  () =>
    import("@/components/upload/UploadPage").then((mod) => ({
      default: mod.UploadPage,
    })),
  {
    ssr: false,
    loading: () => (
      <main className="flex min-h-screen flex-1 flex-col bg-page">
        <div
          className="h-14 shrink-0 border-b border-border-custom bg-card-bg/95"
          aria-hidden
        />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">加载中…</p>
        </div>
      </main>
    ),
  }
);

export function HomeUploadGate() {
  return <UploadPage />;
}
