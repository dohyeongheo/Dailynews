import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, withErrorHandling } from '@/lib/utils/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { checkPageHealth, getVercelDeploymentUrl, type PageHealth } from '@/lib/utils/browser-automation';
import { log } from '@/lib/utils/logger';

/**
 * 관리자 페이지 상태 모니터링
 * GET /api/admin/monitor
 */
export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const url = searchParams.get('url') || await getVercelDeploymentUrl() || 'https://dailynews-rho.vercel.app';
      const adminUrl = `${url}/admin`;

      log.info('관리자 페이지 모니터링 요청', { adminUrl });

      // 페이지 상태 확인
      const pageHealth: PageHealth = await checkPageHealth(adminUrl);

      // API 엔드포인트 응답 상태 확인
      const apiEndpoints = [
        '/api/admin/metrics',
        '/api/admin/analytics',
      ];

      const apiStatuses = await Promise.allSettled(
        apiEndpoints.map(async (endpoint) => {
          try {
            const response = await fetch(`${url}${endpoint}`, {
              method: 'GET',
              headers: {
                'Cookie': request.headers.get('Cookie') || '',
              },
            });
            return {
              endpoint,
              status: response.status,
              ok: response.ok,
            };
          } catch (error) {
            return {
              endpoint,
              status: 0,
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      const apiResults = apiStatuses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            endpoint: apiEndpoints[index],
            status: 0,
            ok: false,
            error: result.reason?.message || 'Request failed',
          };
        }
      });

      // 성능 메트릭
      const metrics = {
        pageLoadTime: pageHealth.loadTime || 0,
        consoleErrorCount: pageHealth.consoleErrors?.length || 0,
        consoleWarningCount: pageHealth.consoleWarnings?.length || 0,
        networkErrorCount: pageHealth.networkErrors?.length || 0,
        apiErrorCount: apiResults.filter((r) => !r.ok).length,
        overallStatus: pageHealth.status,
      };

      return createSuccessResponse({
        pageHealth,
        apiStatuses: apiResults,
        metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      log.error('관리자 페이지 모니터링 실패', error);
      return createErrorResponse(error);
    }
  })
);

/**
 * 관리자 페이지 탭별 에러 확인
 * POST /api/admin/monitor
 */
export const POST = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { tabs } = body; // ['news', 'users', 'monitoring', 'analytics']

      log.info('관리자 페이지 탭별 에러 확인 요청', { tabs });

      const baseUrl = await getVercelDeploymentUrl() || 'https://dailynews-rho.vercel.app';
      const results: Record<string, PageHealth> = {};

      // 각 탭별로 페이지 상태 확인
      const tabUrls: Record<string, string> = {
        news: `${baseUrl}/admin`,
        users: `${baseUrl}/admin`,
        monitoring: `${baseUrl}/admin`,
        analytics: `${baseUrl}/admin`,
      };

      const tabsToCheck = tabs || Object.keys(tabUrls);

      for (const tab of tabsToCheck) {
        if (tabUrls[tab]) {
          try {
            const health = await checkPageHealth(tabUrls[tab]);
            results[tab] = health;
          } catch (error) {
            log.error(`탭 ${tab} 상태 확인 실패`, error);
            results[tab] = {
              url: tabUrls[tab],
              status: 'unknown',
              timestamp: Date.now(),
              consoleErrors: [],
              consoleWarnings: [],
              networkErrors: [],
            };
          }
        }
      }

      // 전체 요약
      const summary = {
        totalTabs: tabsToCheck.length,
        healthyTabs: Object.values(results).filter((r) => r.status === 'healthy').length,
        unhealthyTabs: Object.values(results).filter((r) => r.status === 'unhealthy').length,
        unknownTabs: Object.values(results).filter((r) => r.status === 'unknown').length,
        totalErrors: Object.values(results).reduce((sum, r) => sum + (r.consoleErrors?.length || 0), 0),
        totalWarnings: Object.values(results).reduce((sum, r) => sum + (r.consoleWarnings?.length || 0), 0),
      };

      return createSuccessResponse({
        tabs: results,
        summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      log.error('탭별 에러 확인 실패', error);
      return createErrorResponse(error);
    }
  })
);




