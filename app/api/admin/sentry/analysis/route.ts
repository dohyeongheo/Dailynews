/**
 * AI 에이전트를 위한 Sentry 에러 분석 API
 * Sentry 이슈 조회 및 분석
 */

import { NextRequest } from 'next/server';
import { withAdmin, withErrorHandling } from '@/lib/utils/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { isSentryEnabled, getSentryProjectUrl } from '@/lib/utils/sentry-helper';
import { log } from '@/lib/utils/logger';

interface SentryAnalysisQuery {
  days?: number;
  limit?: number;
  status?: 'unresolved' | 'resolved' | 'ignored';
  query?: string;
}

/**
 * Sentry 이슈 분석 결과 타입
 */
interface SentryIssueAnalysis {
  issueId: string;
  title: string;
  status: string;
  level: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  metadata?: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
  tags?: Array<{ key: string; value: string }>;
  suggestedActions?: string[];
}

/**
 * GET /api/admin/sentry/analysis
 * Sentry 이슈 분석 API
 *
 * Query Parameters:
 * - days: 분석할 기간 (일수, 기본값: 7)
 * - limit: 최대 결과 수 (기본값: 20)
 * - status: 이슈 상태 필터 (unresolved, resolved, ignored)
 * - query: 검색 쿼리 (선택적)
 */
export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      if (!isSentryEnabled()) {
        return createErrorResponse(
          new Error('Sentry가 설정되지 않았습니다. NEXT_PUBLIC_SENTRY_DSN 환경 변수를 확인해주세요.'),
          400
        );
      }

      const searchParams = request.nextUrl.searchParams;
      const query: SentryAnalysisQuery = {
        days: Number(searchParams.get('days')) || 7,
        limit: Number(searchParams.get('limit')) || 20,
        status: (searchParams.get('status') as 'unresolved' | 'resolved' | 'ignored') || 'unresolved',
        query: searchParams.get('query') || undefined,
      };

      log.info('Sentry 분석 API 호출', { query });

      // Sentry MCP 서버를 통해 이슈 조회
      // 실제 구현은 MCP 서버 호출로 대체되어야 함
      // 여기서는 기본 구조만 제공

      const analysisResult = {
        summary: {
          totalIssues: 0,
          unresolvedIssues: 0,
          resolvedIssues: 0,
          ignoredIssues: 0,
          period: `${query.days}일`,
        },
        issues: [] as SentryIssueAnalysis[],
        projectUrl: getSentryProjectUrl(),
        recommendations: [] as string[],
      };

      // TODO: Sentry MCP 서버를 통해 실제 이슈 조회
      // 현재는 구조만 제공하고, 실제 구현은 MCP 서버 호출로 대체 필요
      // 예시:
      // const issues = await mcp_Sentry_search_issues({
      //   organizationSlug: 'personal-4vx',
      //   projectSlug: 'daily-news',
      //   naturalLanguageQuery: query.query || `최근 ${query.days}일간 발생한 에러`,
      //   limit: query.limit,
      // });

      log.info('Sentry 분석 완료', {
        totalIssues: analysisResult.summary.totalIssues,
        unresolvedIssues: analysisResult.summary.unresolvedIssues,
      });

      return createSuccessResponse(analysisResult);
    } catch (error) {
      log.error('Sentry 분석 API 오류', error);
      return createErrorResponse(error);
    }
  })
);

/**
 * POST /api/admin/sentry/analysis
 * 특정 이슈에 대한 상세 분석 요청
 */
export const POST = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      if (!isSentryEnabled()) {
        return createErrorResponse(
          new Error('Sentry가 설정되지 않았습니다.'),
          400
        );
      }

      const body = await request.json();
      const { issueId, issueUrl } = body;

      if (!issueId && !issueUrl) {
        return createErrorResponse(
          new Error('issueId 또는 issueUrl이 필요합니다.'),
          400
        );
      }

      log.info('Sentry 이슈 상세 분석 요청', { issueId, issueUrl });

      // TODO: Sentry MCP 서버를 통해 이슈 상세 정보 조회
      // 예시:
      // const issueDetails = await mcp_Sentry_get_issue_details({
      //   issueUrl: issueUrl || issueId,
      // });

      // TODO: Seer를 통한 AI 분석 (선택적)
      // const seerAnalysis = await mcp_Sentry_analyze_issue_with_seer({
      //   issueUrl: issueUrl || issueId,
      // });

      const analysisResult = {
        issueId: issueId || 'unknown',
        details: null as any,
        seerAnalysis: null as any,
        suggestedFix: null as string | null,
        relatedIssues: [] as any[],
      };

      return createSuccessResponse(analysisResult);
    } catch (error) {
      log.error('Sentry 이슈 상세 분석 오류', error);
      return createErrorResponse(error);
    }
  })
);





