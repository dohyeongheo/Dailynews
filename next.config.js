/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // 성능 최적화
  compress: true,

  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Vercel Blob Storage 도메인 허용
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },

  // 실험적 기능
  experimental: {
    optimizePackageImports: ['@google/generative-ai', '@supabase/supabase-js'],
  },

  // Webpack 설정: pino-pretty와 thread-stream 처리
  webpack: (config, { isServer, dev }) => {
    if (isServer && !dev) {
      // 프로덕션 빌드에서 pino-pretty와 thread-stream을 외부 모듈로 처리
      // 이렇게 하면 worker thread 파일이 번들에 포함되지 않음
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('pino-pretty', 'thread-stream');
      } else {
        config.externals = [
          config.externals,
          'pino-pretty',
          'thread-stream',
        ];
      }
    }

    // 참고: "Serializing big strings" 경고는 webpack의 내부 캐시 전략에서 발생하는
    // 성능 최적화 제안입니다. 이 경고는 빌드 결과나 기능에 영향을 주지 않으며,
    // Next.js의 자체 캐시 최적화로 인해 실제 성능 영향은 미미합니다.
    // 이 경고는 무시해도 됩니다.

    return config;
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
      // 기존에 nextConfig.sentry 안에 두었던 옵션들을 여기로 이동
      hideSourceMaps: true,
      widenClientFileUpload: true,
    })
  : nextConfig;
