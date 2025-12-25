import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import dynamic from "next/dynamic";
import { log } from "@/lib/utils/logger";

// 동적 임포트로 성능 최적화
const Header = dynamic(() => import("@/components/Header"), { ssr: true });

// 환경 변수 검증 (런타임에만 실행, 빌드 시에는 건너뛰기)
// 빌드 시점에는 환경 변수가 없을 수 있으므로 조건부로 실행
if (typeof window === "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    require("@/lib/config/env-check");
  } catch (error) {
    // 빌드 시 환경 변수가 없을 수 있으므로 무시
    log.warn("Env 환경 변수 검증 건너뜀 (런타임에 검증됨)");
  }
}

export const metadata: Metadata = {
  title: "Daily News - 태국 및 한국 뉴스 요약",
  description: "매일 태국 및 한국의 최신 뉴스를 수집하고 요약하는 서비스",
  icons: {
    icon: "/icon.svg",
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Providers>
          <ErrorBoundary>
            <Header />
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
