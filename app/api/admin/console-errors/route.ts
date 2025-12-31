import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, withErrorHandling } from '@/lib/utils/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { collectConsoleErrors, checkPageHealth, type ConsoleMessage, type PageHealth } from '@/lib/utils/browser-automation';
import { log } from '@/lib/utils/logger';

/**
 * 콘솔 에러 목록 조회
 * GET /api/admin/console-errors
 */
export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const url = searchParams.get('url') || 'https://dailynews-rho.vercel.app/admin';
      const filterLevel = searchParams.get('level')?.split(',') as ('error' | 'warning' | 'info' | 'log' | 'debug')[] || ['error', 'warning'];

      log.info('콘솔 에러 조회 요청', { url, filterLevel });

      // 콘솔 에러 수집
      const consoleErrors = await collectConsoleErrors(filterLevel);

      // 에러 타입별 분류
      const errors = consoleErrors.filter((msg) => msg.level === 'error');
      const warnings = consoleErrors.filter((msg) => msg.level === 'warning');
      const infos = consoleErrors.filter((msg) => msg.level === 'info');

      // 에러 발생 위치 추적
      const errorLocations = errors.map((error) => {
        const stack = error.stack || '';
        const fileMatch = stack.match(/https?:\/\/[^\s]+/);
        const lineMatch = stack.match(/:(\d+):(\d+)/);

        return {
          message: error.message,
          source: error.source || fileMatch?.[0] || 'unknown',
          line: lineMatch ? parseInt(lineMatch[1]) : null,
          column: lineMatch ? parseInt(lineMatch[2]) : null,
          stack: error.stack,
        };
      });

      // 관련 코드 파일 식별
      const relatedFiles = new Set<string>();
      errors.forEach((error) => {
        const stack = error.stack || '';
        const fileMatches = stack.matchAll(/https?:\/\/[^\s]+/g);
        for (const match of fileMatches) {
          const url = match[0];
          // Next.js 빌드 파일에서 원본 파일 경로 추출 시도
          if (url.includes('_next/static/chunks')) {
            // 빌드 파일은 원본 파일 경로를 직접 추출하기 어려움
            relatedFiles.add(url);
          } else {
            relatedFiles.add(url);
          }
        }
      });

      return createSuccessResponse({
        total: consoleErrors.length,
        errors: errors.length,
        warnings: warnings.length,
        infos: infos.length,
        messages: consoleErrors,
        errorLocations,
        relatedFiles: Array.from(relatedFiles),
      });
    } catch (error) {
      log.error('콘솔 에러 조회 실패', error);
      return createErrorResponse(error);
    }
  })
);

/**
 * 콘솔 에러 분석
 * POST /api/admin/console-errors
 */
export const POST = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { url, messages } = body;

      log.info('콘솔 에러 분석 요청', { url, messageCount: messages?.length || 0 });

      // 제공된 메시지가 있으면 사용, 없으면 수집
      const consoleMessages: ConsoleMessage[] = messages || await collectConsoleErrors(['error', 'warning']);

      // 에러 분석
      const analysis = {
        totalErrors: consoleMessages.filter((m) => m.level === 'error').length,
        totalWarnings: consoleMessages.filter((m) => m.level === 'warning').length,
        errorTypes: new Map<string, number>(),
        commonErrors: [] as Array<{ message: string; count: number }>,
        suggestedFixes: [] as string[],
      };

      // 에러 타입별 집계
      consoleMessages.forEach((msg) => {
        if (msg.level === 'error') {
          const key = msg.message.split('\n')[0]; // 첫 줄만 사용
          analysis.errorTypes.set(key, (analysis.errorTypes.get(key) || 0) + 1);
        }
      });

      // 자주 발생하는 에러 찾기
      analysis.errorTypes.forEach((count, message) => {
        if (count > 1) {
          analysis.commonErrors.push({ message, count });
        }
      });
      analysis.commonErrors.sort((a, b) => b.count - a.count);

      // 해결 방안 제시
      consoleMessages.forEach((msg) => {
        if (msg.level === 'error') {
          if (msg.message.includes('Failed to fetch')) {
            analysis.suggestedFixes.push('네트워크 요청 실패: API 엔드포인트 확인 및 CORS 설정 확인');
          } else if (msg.message.includes('Cannot read property')) {
            analysis.suggestedFixes.push('null/undefined 참조 오류: 옵셔널 체이닝 또는 기본값 설정');
          } else if (msg.message.includes('is not defined')) {
            analysis.suggestedFixes.push('정의되지 않은 변수: import 문 또는 변수 선언 확인');
          } else if (msg.message.includes('Unexpected token')) {
            analysis.suggestedFixes.push('구문 오류: 코드 문법 확인');
          }
        }
      });

      // 중복 제거
      analysis.suggestedFixes = Array.from(new Set(analysis.suggestedFixes));

      return createSuccessResponse({
        analysis,
        messages: consoleMessages,
      });
    } catch (error) {
      log.error('콘솔 에러 분석 실패', error);
      return createErrorResponse(error);
    }
  })
);




