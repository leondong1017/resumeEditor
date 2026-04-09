import { HomeUploadGate } from "./HomeUploadGate";

/**
 * Upload 树仅在客户端挂载，避免 Turbopack 热更新后「服务端 HTML 仍为旧版、客户端为新 bundle」导致的 Tabs hydration mismatch。
 * @see app/HomeUploadGate.tsx
 */
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeUploadGate />;
}
