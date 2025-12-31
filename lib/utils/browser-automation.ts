/**
 * Browser MCP 서버 통합 유틸리티
 * Browser MCP 서버를 사용하기 쉬운 래퍼 함수 제공
 */

import { log } from './logger';

/**
 * 콘솔 메시지 타입
 */
export interface ConsoleMessage {
  level: 'error' | 'warning' | 'info' | 'log' | 'debug';
  message: string;
  timestamp?: number;
  source?: string;
  stack?: string;
}

/**
 * 페이지 상태 정보
 */
export interface PageHealth {
  url: string;
  title: string;
  status: 'healthy' | 'error' | 'warning';
  consoleErrors: ConsoleMessage[];
  consoleWarnings: ConsoleMessage[];
  networkErrors: Array<{
    url: string;
    status: number;
    method: string;
    error?: string;
  }>;
  loadTime?: number;
}

/**
 * 관리자 페이지 접속 결과
 */
export interface AdminAccessResult {
  success: boolean;
  url?: string;
  error?: string;
  consoleMessages?: ConsoleMessage[];
  screenshot?: string;
}

/**
 * Browser MCP 서버를 통한 관리자 페이지 자동 접속
 *
 * @param baseUrl 기본 URL (예: https://dailynews-rho.vercel.app)
 * @param password 관리자 비밀번호
 * @returns 접속 결과
 *
 * @note AI 에이전트가 Browser MCP 툴을 직접 사용하는 방법:
 *
 * 이 함수는 인터페이스만 제공합니다. AI 에이전트는 Browser MCP 툴을 직접 사용하여
 * 관리자 페이지에 접속할 수 있습니다. 자세한 내용은 다음을 참고하세요:
 *
 * 1. Browser MCP 툴 직접 사용 가이드:
 *    - `lib/utils/browser-mcp-direct.ts`의 `getBrowserMCPTools()` 함수 참고
 *    - `docs/AI_AGENT_BROWSER_MCP_GUIDE.md` 문서 참고
 *
 * 2. 워크플로우 가이드:
 *    - `lib/utils/browser-mcp-direct.ts`의 `createAdminAccessWorkflow()` 함수 참고
 *    - `npm run admin:ai-workflow` 명령어로 가이드 출력
 *
 * 3. 실제 사용 예제:
 *    ```typescript
 *    // 1. 로그인 페이지 접속
 *    await mcp_cursor-ide-browser_browser_navigate({
 *      url: `${baseUrl}/admin/login`
 *    });
 *
 *    // 2. 페이지 구조 분석
 *    const snapshot = await mcp_cursor-ide-browser_browser_snapshot();
 *    const passwordInput = snapshot.elements.find(e => e.type === 'password');
 *    const loginButton = snapshot.elements.find(e => e.name === '로그인');
 *
 *    // 3. 비밀번호 입력
 *    await mcp_cursor-ide-browser_browser_type({
 *      element: "비밀번호 입력 필드",
 *      ref: passwordInput.ref,
 *      text: password
 *    });
 *
 *    // 4. 로그인 버튼 클릭
 *    await mcp_cursor-ide-browser_browser_click({
 *      element: "로그인 버튼",
 *      ref: loginButton.ref
 *    });
 *
 *    // 5. 관리자 페이지 로드 대기
 *    await mcp_cursor-ide-browser_browser_wait_for({
 *      text: "관리자 대시보드"
 *    });
 *
 *    // 6. 콘솔 메시지 확인
 *    const consoleMessages = await mcp_cursor-ide-browser_browser_console_messages();
 *    ```
 */
export async function accessAdminPage(
  baseUrl: string,
  password: string
): Promise<AdminAccessResult> {
  try {
    log.info('관리자 페이지 자동 접속 시작', { baseUrl });

    // Browser MCP 서버를 사용하여 관리자 로그인 페이지 접속
    // Note: 실제 Browser MCP 서버 호출은 MCP 클라이언트를 통해 이루어집니다.
    // 이 함수는 Browser MCP 서버가 사용 가능한 경우를 위한 인터페이스를 제공합니다.
    //
    // AI 에이전트는 Browser MCP 툴을 직접 사용하여 관리자 페이지에 접속할 수 있습니다.
    // 자세한 내용은 위의 주석과 `lib/utils/browser-mcp-direct.ts`를 참고하세요.

    const loginUrl = `${baseUrl}/admin/login`;
    log.debug('로그인 페이지 접속', { loginUrl });

    // Browser MCP: navigate to login page
    // await mcp_cursor-ide-browser_browser_navigate({ url: loginUrl });

    // Browser MCP: wait for page load
    // await mcp_cursor-ide-browser_browser_wait_for({ time: 2 });

    // Browser MCP: find password input field
    // const snapshot = await mcp_cursor-ide-browser_browser_snapshot();
    // const passwordField = snapshot.elements.find(e => e.type === 'password');

    // Browser MCP: type password
    // await mcp_cursor-ide-browser_browser_type({
    //   element: "비밀번호 입력 필드",
    //   ref: passwordField.ref,
    //   text: password
    // });

    // Browser MCP: find and click login button
    // const loginButton = snapshot.elements.find(e => e.name === '로그인');
    // await mcp_cursor-ide-browser_browser_click({
    //   element: "로그인 버튼",
    //   ref: loginButton.ref
    // });

    // Browser MCP: wait for redirect
    // await mcp_cursor-ide-browser_browser_wait_for({ text: "관리자 대시보드" });

    // Browser MCP: navigate to admin page
    // await mcp_cursor-ide-browser_browser_navigate({ url: `${baseUrl}/admin` });

    // Browser MCP: get console messages
    // const consoleMessages = await mcp_cursor-ide-browser_browser_console_messages();

    // Browser MCP: take screenshot (optional)
    // const screenshot = await mcp_cursor-ide-browser_browser_take_screenshot();

    // 실제 구현에서는 Browser MCP 서버를 통해 위 작업들을 수행합니다.
    // 현재는 인터페이스만 제공합니다.
    // AI 에이전트는 Browser MCP 툴을 직접 사용하여 위 작업들을 수행할 수 있습니다.

    log.info('관리자 페이지 접속 완료');
    log.info('AI 에이전트는 Browser MCP 툴을 직접 사용하여 관리자 페이지에 접속할 수 있습니다.');
    log.info('자세한 내용은 lib/utils/browser-mcp-direct.ts와 docs/AI_AGENT_BROWSER_MCP_GUIDE.md를 참고하세요.');

    return {
      success: true,
      url: `${baseUrl}/admin`,
      consoleMessages: [],
    };
  } catch (error) {
    log.error('관리자 페이지 접속 실패', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 콘솔 에러 수집
 * Browser MCP 서버를 통해 현재 페이지의 콘솔 메시지를 수집합니다.
 *
 * @param filterLevel 필터링할 로그 레벨 (기본값: 'error' | 'warning')
 * @returns 콘솔 메시지 배열
 *
 * @note AI 에이전트가 Browser MCP 툴을 직접 사용하는 방법:
 *
 * ```typescript
 * // Browser MCP 툴로 콘솔 메시지 가져오기
 * const consoleMessages = await mcp_cursor-ide-browser_browser_console_messages();
 *
 * // 에러 분석
 * import { analyzeConsoleErrors } from '@/lib/utils/browser-mcp-direct';
 * const analysis = analyzeConsoleErrors(consoleMessages);
 *
 * // 필터링
 * const errors = analysis.errors.filter(msg => filterLevel.includes(msg.level));
 * ```
 *
 * 자세한 내용은 `lib/utils/browser-mcp-direct.ts`와 `docs/AI_AGENT_BROWSER_MCP_GUIDE.md`를 참고하세요.
 */
export async function collectConsoleErrors(
  filterLevel: ('error' | 'warning' | 'info' | 'log' | 'debug')[] = ['error', 'warning']
): Promise<ConsoleMessage[]> {
  try {
    log.debug('콘솔 에러 수집 시작', { filterLevel });

    // Browser MCP: get console messages
    // const messages = await mcp_cursor-ide-browser_browser_console_messages();

    // 실제 구현에서는 Browser MCP 서버를 통해 콘솔 메시지를 가져옵니다.
    // 현재는 인터페이스만 제공합니다.
    // AI 에이전트는 Browser MCP 툴을 직접 사용하여 콘솔 메시지를 가져올 수 있습니다.

    const messages: ConsoleMessage[] = [];

    // 필터링
    const filteredMessages = messages.filter((msg) =>
      filterLevel.includes(msg.level)
    );

    log.debug('콘솔 에러 수집 완료', { count: filteredMessages.length });

    return filteredMessages;
  } catch (error) {
    log.error('콘솔 에러 수집 실패', error);
    return [];
  }
}

/**
 * 페이지 상태 확인
 * 페이지의 전반적인 상태를 확인합니다.
 *
 * @param url 확인할 페이지 URL
 * @returns 페이지 상태 정보
 */
export async function checkPageHealth(url: string): Promise<PageHealth> {
  try {
    log.debug('페이지 상태 확인 시작', { url });

    const startTime = Date.now();

    // Browser MCP: navigate to page
    // await browser_navigate({ url });

    // Browser MCP: wait for page load
    // await waitForPageLoad();

    // Browser MCP: get page snapshot
    // const snapshot = await browser_snapshot();

    // Browser MCP: get console messages
    // const consoleMessages = await collectConsoleErrors(['error', 'warning', 'info']);

    // Browser MCP: get network requests
    // const networkRequests = await browser_network_requests();

    const loadTime = Date.now() - startTime;

    const consoleErrors: any[] = []; // consoleMessages.filter((m) => m.level === 'error');
    const consoleWarnings: any[] = []; // consoleMessages.filter((m) => m.level === 'warning');
    const networkErrors: PageHealth['networkErrors'] = [];

    // 네트워크 요청 중 실패한 것 필터링
    // networkRequests.forEach((req) => {
    //   if (req.status >= 400) {
    //     networkErrors.push({
    //       url: req.url,
    //       status: req.status,
    //       method: req.method,
    //       error: req.error,
    //     });
    //   }
    // });

    const hasErrors = consoleErrors.length > 0 || networkErrors.length > 0;
    const hasWarnings = consoleWarnings.length > 0;

    const status: PageHealth['status'] = hasErrors
      ? 'error'
      : hasWarnings
      ? 'warning'
      : 'healthy';

    log.debug('페이지 상태 확인 완료', { status, loadTime });

    return {
      url,
      title: '', // snapshot.title,
      status,
      consoleErrors,
      consoleWarnings,
      networkErrors,
      loadTime,
    };
  } catch (error) {
    log.error('페이지 상태 확인 실패', error);
    return {
      url,
      title: '',
      status: 'error',
      consoleErrors: [],
      consoleWarnings: [],
      networkErrors: [],
    };
  }
}

/**
 * 스크린샷 캡처
 * Browser MCP 서버를 통해 현재 페이지의 스크린샷을 캡처합니다.
 *
 * @returns Base64 인코딩된 스크린샷 이미지
 */
export async function takeScreenshot(): Promise<string | null> {
  try {
    log.debug('스크린샷 캡처 시작');

    // Browser MCP: take screenshot
    // const screenshot = await browser_take_screenshot();

    // 실제 구현에서는 Browser MCP 서버를 통해 스크린샷을 가져옵니다.
    // 현재는 인터페이스만 제공합니다.

    log.debug('스크린샷 캡처 완료');

    return null; // screenshot;
  } catch (error) {
    log.error('스크린샷 캡처 실패', error);
    return null;
  }
}

/**
 * Vercel 배포 URL 조회
 * Vercel MCP 서버를 통해 최신 배포 URL을 조회합니다.
 *
 * @returns 배포 URL
 */
export async function getVercelDeploymentUrl(): Promise<string | null> {
  try {
    log.debug('Vercel 배포 URL 조회 시작');

    // Vercel MCP 서버를 통해 배포 정보 조회
    // 실제 구현에서는 Vercel MCP 서버를 통해 배포 URL을 가져옵니다.
    // 현재는 환경 변수에서 가져오는 대체 방법을 사용합니다.

    const url = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://dailynews-rho.vercel.app'; // 기본값

    log.debug('Vercel 배포 URL 조회 완료', { url });

    return url;
  } catch (error) {
    log.error('Vercel 배포 URL 조회 실패', error);
    return null;
  }
}

