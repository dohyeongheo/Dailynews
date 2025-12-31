/**
 * Browser Automation 유틸리티
 * Browser MCP 서버를 사용한 자동화 기능을 제공합니다.
 */

import { log } from './logger';

/**
 * 콘솔 메시지 타입
 */
export interface ConsoleMessage {
  level: 'error' | 'warning' | 'info' | 'log' | 'debug';
  message: string;
  timestamp: number;
  source?: string;
  stack?: string;
}

/**
 * 페이지 상태 정보
 */
export interface PageHealth {
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  statusCode?: number;
  loadTime?: number;
  errorCount?: number;
  warningCount?: number;
  timestamp: number;
  errors?: string[];
  consoleErrors?: ConsoleMessage[];
  consoleWarnings?: ConsoleMessage[];
  networkErrors?: Array<{
    url: string;
    status: number;
    method: string;
    error?: string;
  }>;
}

/**
 * 관리자 페이지 접속 결과
 */
export interface AdminAccessResult {
  success: boolean;
  url?: string;
  error?: string;
  timestamp: number;
}

/**
 * 콘솔 에러 수집
 * Browser MCP 서버를 통해 콘솔 메시지를 수집합니다.
 *
 * @param filterLevel 필터링할 로그 레벨
 * @returns 콘솔 메시지 배열
 */
export async function collectConsoleErrors(
  filterLevel: ('error' | 'warning' | 'info' | 'log' | 'debug')[] = ['error', 'warning']
): Promise<ConsoleMessage[]> {
  try {
    // Browser MCP 서버는 서버 사이드에서 직접 호출할 수 없으므로
    // 클라이언트 사이드에서 수집된 에러를 API를 통해 전달받는 방식으로 구현
    // 현재는 빈 배열 반환 (실제 구현은 클라이언트 사이드에서 수행)
    log.warn('collectConsoleErrors는 서버 사이드에서 직접 호출할 수 없습니다. 클라이언트 사이드에서 수집된 에러를 API를 통해 전달받아야 합니다.');
    return [];
  } catch (error) {
    log.error('콘솔 에러 수집 실패', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * 페이지 상태 확인
 *
 * @param url 확인할 페이지 URL
 * @returns 페이지 상태 정보
 */
export async function checkPageHealth(url: string): Promise<PageHealth> {
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DailyNews-Bot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    const loadTime = Date.now() - startTime;
    const statusCode = response.status;

    return {
      url,
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode,
      loadTime,
      errorCount: 0,
      warningCount: 0,
      timestamp: Date.now(),
      errors: response.ok ? undefined : [`HTTP ${statusCode}: ${response.statusText}`],
    };
  } catch (error) {
    log.error('페이지 상태 확인 실패', error instanceof Error ? error : new Error(String(error)), { url });
    return {
      url,
      status: 'unknown',
      timestamp: Date.now(),
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Vercel 배포 URL 조회
 *
 * @returns Vercel 배포 URL 또는 null
 */
export async function getVercelDeploymentUrl(): Promise<string | null> {
  try {
    // 환경 변수에서 Vercel URL 확인
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
    if (vercelUrl) {
      return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    }

    // 기본 배포 URL 반환
    return 'https://dailynews-rho.vercel.app';
  } catch (error) {
    log.error('Vercel 배포 URL 조회 실패', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * 관리자 페이지 자동 접속
 * Browser MCP 서버를 사용하여 관리자 페이지에 자동으로 접속합니다.
 *
 * @param baseUrl 기본 URL
 * @param password 관리자 비밀번호
 * @returns 접속 결과
 */
export async function accessAdminPage(
  baseUrl: string,
  password: string
): Promise<AdminAccessResult> {
  try {
    // Browser MCP 서버는 서버 사이드에서 직접 호출할 수 없으므로
    // 실제 구현은 클라이언트 사이드 스크립트에서 수행되어야 합니다
    log.warn('accessAdminPage는 서버 사이드에서 직접 호출할 수 없습니다. 클라이언트 사이드 스크립트를 사용하세요.');

    return {
      success: false,
      error: 'Browser MCP 서버는 서버 사이드에서 직접 호출할 수 없습니다.',
      timestamp: Date.now(),
    };
  } catch (error) {
    log.error('관리자 페이지 접속 실패', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    };
  }
}

/**
 * 스크린샷 캡처
 * Browser MCP 서버를 사용하여 현재 페이지의 스크린샷을 캡처합니다.
 *
 * @param filename 저장할 파일명 (선택)
 * @returns 스크린샷 파일 경로 또는 null
 */
export async function takeScreenshot(filename?: string): Promise<string | null> {
  try {
    // Browser MCP 서버는 서버 사이드에서 직접 호출할 수 없으므로
    // 실제 구현은 클라이언트 사이드 스크립트에서 수행되어야 합니다
    log.warn('takeScreenshot는 서버 사이드에서 직접 호출할 수 없습니다. 클라이언트 사이드 스크립트를 사용하세요.');
    return null;
  } catch (error) {
    log.error('스크린샷 캡처 실패', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}
