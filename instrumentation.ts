/**
 * Next.js Instrumentation 파일
 * Sentry 서버 사이드 및 Edge 설정
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js 런타임 (서버 사이드)
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge 런타임
    await import('./sentry.edge.config');
  }
}

