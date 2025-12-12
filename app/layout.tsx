import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daily News - 태국 및 한국 뉴스 요약',
  description: '매일 태국 및 한국의 최신 뉴스를 수집하고 요약하는 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}

