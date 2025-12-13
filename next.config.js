/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Sentry 설정
  sentry: {
    // 자동 소스맵 업로드 비활성화 (선택사항)
    hideSourceMaps: true,
    // 와일드카드 경로 제외
    widenClientFileUpload: true,
  },

  // 성능 최적화
  compress: true,

  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 실험적 기능
  experimental: {
    optimizePackageImports: ['@google/generative-ai', '@supabase/supabase-js'],
  },
};

// Sentry가 설정된 경우에만 래핑
const isSentryEnabled = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

module.exports = isSentryEnabled
  ? withSentryConfig(nextConfig, {
      // Sentry Webpack Plugin 옵션
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    })
  : nextConfig;
