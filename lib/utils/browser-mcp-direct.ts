/**
 * Browser MCP 툴 직접 호출 유틸리티
 * AI 에이전트가 Browser MCP 툴을 직접 사용할 수 있도록 하는 헬퍼 함수들
 */

import { log } from './logger';
import type { ConsoleMessage } from './browser-automation';

/**
 * Browser MCP 툴 정보
 */
export interface BrowserMCPTool {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  example: string;
}

/**
 * 사용 가능한 Browser MCP 툴 목록 반환
 * AI 에이전트가 이 정보를 참고하여 Browser MCP 툴을 직접 호출할 수 있습니다.
 */
export function getBrowserMCPTools(): BrowserMCPTool[] {
  return [
    {
      name: 'mcp_cursor-ide-browser_browser_navigate',
      description: '웹 페이지로 이동합니다.',
      parameters: [
        {
          name: 'url',
          type: 'string',
          description: '이동할 페이지의 URL',
          required: true,
        },
      ],
      example: 'mcp_cursor-ide-browser_browser_navigate({ url: "http://localhost:3000/admin/login" })',
    },
    {
      name: 'mcp_cursor-ide-browser_browser_snapshot',
      description: '현재 페이지의 접근성 스냅샷을 캡처하여 페이지 구조를 분석합니다.',
      parameters: [],
      example: 'mcp_cursor-ide-browser_browser_snapshot()',
    },
    {
      name: 'mcp_cursor-ide-browser_browser_click',
      description: '페이지의 요소를 클릭합니다.',
      parameters: [
        {
          name: 'element',
          type: 'string',
          description: '클릭할 요소의 설명 (예: "로그인 버튼")',
          required: true,
        },
        {
          name: 'ref',
          type: 'string',
          description: 'browser_snapshot에서 얻은 요소 참조 ID',
          required: true,
        },
      ],
      example: 'mcp_cursor-ide-browser_browser_click({ element: "로그인 버튼", ref: "button-123" })',
    },
    {
      name: 'mcp_cursor-ide-browser_browser_type',
      description: '입력 필드에 텍스트를 입력합니다.',
      parameters: [
        {
          name: 'element',
          type: 'string',
          description: '입력할 요소의 설명 (예: "비밀번호 입력 필드")',
          required: true,
        },
        {
          name: 'ref',
          type: 'string',
          description: 'browser_snapshot에서 얻은 요소 참조 ID',
          required: true,
        },
        {
          name: 'text',
          type: 'string',
          description: '입력할 텍스트',
          required: true,
        },
        {
          name: 'submit',
          type: 'boolean',
          description: '입력 후 Enter 키를 누를지 여부',
          required: false,
        },
      ],
      example: 'mcp_cursor-ide-browser_browser_type({ element: "비밀번호 입력 필드", ref: "input-456", text: "password123" })',
    },
    {
      name: 'mcp_cursor-ide-browser_browser_console_messages',
      description: '브라우저 콘솔의 메시지를 가져옵니다.',
      parameters: [],
      example: 'mcp_cursor-ide-browser_browser_console_messages()',
    },
    {
      name: 'mcp_cursor-ide-browser_browser_network_requests',
      description: '페이지의 네트워크 요청 목록을 가져옵니다.',
      parameters: [],
      example: 'mcp_cursor-ide-browser_browser_network_requests()',
    },
    {
      name: 'mcp_cursor-ide-browser_browser_take_screenshot',
      description: '현재 페이지의 스크린샷을 캡처합니다.',
      parameters: [
        {
          name: 'filename',
          type: 'string',
          description: '저장할 파일명 (선택사항)',
          required: false,
        },
        {
          name: 'fullPage',
          type: 'boolean',
          description: '전체 페이지 스크린샷 여부',
          required: false,
        },
      ],
      example: 'mcp_cursor-ide-browser_browser_take_screenshot({ filename: "admin-page.png" })',
    },
    {
      name: 'mcp_cursor-ide-browser_browser_wait_for',
      description: '특정 조건이 만족될 때까지 대기합니다.',
      parameters: [
        {
          name: 'text',
          type: 'string',
          description: '대기할 텍스트가 나타날 때까지 대기',
          required: false,
        },
        {
          name: 'textGone',
          type: 'string',
          description: '대기할 텍스트가 사라질 때까지 대기',
          required: false,
        },
        {
          name: 'time',
          type: 'number',
          description: '대기할 시간 (초)',
          required: false,
        },
      ],
      example: 'mcp_cursor-ide-browser_browser_wait_for({ text: "관리자 대시보드" })',
    },
  ];
}

/**
 * 관리자 페이지 접속 워크플로우 생성
 * AI 에이전트가 이 워크플로우를 따라 Browser MCP 툴을 사용할 수 있습니다.
 */
export function createAdminAccessWorkflow(baseUrl: string, password: string): Array<{
  step: number;
  description: string;
  tool: string;
  parameters: Record<string, unknown>;
  expectedResult: string;
}> {
  return [
    {
      step: 1,
      description: '관리자 로그인 페이지로 이동',
      tool: 'mcp_cursor-ide-browser_browser_navigate',
      parameters: {
        url: `${baseUrl}/admin/login`,
      },
      expectedResult: '로그인 페이지가 로드됨',
    },
    {
      step: 2,
      description: '페이지 구조 분석 (로그인 폼 요소 찾기)',
      tool: 'mcp_cursor-ide-browser_browser_snapshot',
      parameters: {},
      expectedResult: '비밀번호 입력 필드와 로그인 버튼의 ref ID를 얻음',
    },
    {
      step: 3,
      description: '비밀번호 입력 필드에 비밀번호 입력',
      tool: 'mcp_cursor-ide-browser_browser_type',
      parameters: {
        element: '비밀번호 입력 필드',
        ref: 'INPUT_REF_FROM_SNAPSHOT', // browser_snapshot에서 얻은 실제 ref로 교체 필요
        text: password,
      },
      expectedResult: '비밀번호가 입력됨',
    },
    {
      step: 4,
      description: '로그인 버튼 클릭',
      tool: 'mcp_cursor-ide-browser_browser_click',
      parameters: {
        element: '로그인 버튼',
        ref: 'BUTTON_REF_FROM_SNAPSHOT', // browser_snapshot에서 얻은 실제 ref로 교체 필요
      },
      expectedResult: '로그인 요청이 제출되고 리다이렉트됨',
    },
    {
      step: 5,
      description: '관리자 페이지로 리다이렉트 대기',
      tool: 'mcp_cursor-ide-browser_browser_wait_for',
      parameters: {
        text: '관리자 대시보드',
      },
      expectedResult: '관리자 페이지가 로드됨',
    },
    {
      step: 6,
      description: '관리자 페이지로 이동 (리다이렉트가 안 된 경우)',
      tool: 'mcp_cursor-ide-browser_browser_navigate',
      parameters: {
        url: `${baseUrl}/admin`,
      },
      expectedResult: '관리자 대시보드가 표시됨',
    },
    {
      step: 7,
      description: '콘솔 메시지 확인',
      tool: 'mcp_cursor-ide-browser_browser_console_messages',
      parameters: {},
      expectedResult: '콘솔 에러, 경고, 정보 메시지 목록을 얻음',
    },
    {
      step: 8,
      description: '네트워크 요청 확인 (선택사항)',
      tool: 'mcp_cursor-ide-browser_browser_network_requests',
      parameters: {},
      expectedResult: '실패한 네트워크 요청 목록을 얻음',
    },
  ];
}

/**
 * 콘솔 에러 분석
 * Browser MCP에서 수집한 콘솔 메시지를 분석합니다.
 */
export function analyzeConsoleErrors(
  consoleMessages: Array<{
    level?: string;
    text?: string;
    type?: string;
    [key: string]: unknown;
  }>
): {
  errors: ConsoleMessage[];
  warnings: ConsoleMessage[];
  infos: ConsoleMessage[];
  analysis: {
    totalErrors: number;
    totalWarnings: number;
    errorTypes: Map<string, number>;
    commonErrors: Array<{ message: string; count: number }>;
    suggestedFixes: string[];
  };
} {
  const errors: ConsoleMessage[] = [];
  const warnings: ConsoleMessage[] = [];
  const infos: ConsoleMessage[] = [];

  // Browser MCP 콘솔 메시지 형식에 맞게 파싱
  consoleMessages.forEach((msg) => {
    const level = (msg.level || msg.type || 'log').toLowerCase();
    const message = String(msg.text || msg.message || '');

    const consoleMessage: ConsoleMessage = {
      level: level as ConsoleMessage['level'],
      message,
      timestamp: Date.now(),
      source: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (level === 'error') {
      errors.push(consoleMessage);
    } else if (level === 'warning' || level === 'warn') {
      warnings.push(consoleMessage);
    } else {
      infos.push(consoleMessage);
    }
  });

  // 에러 분석
  const errorTypes = new Map<string, number>();
  errors.forEach((error) => {
    const key = error.message.split('\n')[0]; // 첫 줄만 사용
    errorTypes.set(key, (errorTypes.get(key) || 0) + 1);
  });

  const commonErrors: Array<{ message: string; count: number }> = [];
  errorTypes.forEach((count, message) => {
    if (count > 1) {
      commonErrors.push({ message, count });
    }
  });
  commonErrors.sort((a, b) => b.count - a.count);

  // 해결 방안 제시
  const suggestedFixes: string[] = [];
  errors.forEach((error) => {
    if (error.message.includes('Failed to fetch')) {
      suggestedFixes.push('네트워크 요청 실패: API 엔드포인트 확인 및 CORS 설정 확인');
    } else if (error.message.includes('Cannot read property') || error.message.includes("Cannot read properties")) {
      suggestedFixes.push('null/undefined 참조 오류: 옵셔널 체이닝 또는 기본값 설정');
    } else if (error.message.includes('is not defined')) {
      suggestedFixes.push('정의되지 않은 변수: import 문 또는 변수 선언 확인');
    } else if (error.message.includes('Unexpected token')) {
      suggestedFixes.push('구문 오류: 코드 문법 확인');
    } else if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
      suggestedFixes.push('클라이언트 차단: 브라우저 확장 프로그램 또는 CORS 정책 확인');
    } else if (error.message.includes('404')) {
      suggestedFixes.push('리소스를 찾을 수 없음: 파일 경로 또는 API 엔드포인트 확인');
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      suggestedFixes.push('인증 실패: 세션 쿠키 또는 인증 토큰 확인');
    } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      suggestedFixes.push('서버 오류: 서버 로그 확인 및 에러 핸들링 개선');
    }
  });

  // 중복 제거
  const uniqueFixes = Array.from(new Set(suggestedFixes));

  return {
    errors,
    warnings,
    infos,
    analysis: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      errorTypes,
      commonErrors,
      suggestedFixes: uniqueFixes,
    },
  };
}

/**
 * 에러 리포트 생성
 */
export function generateErrorReport(
  consoleMessages: Array<{
    level?: string;
    text?: string;
    type?: string;
    [key: string]: unknown;
  }>,
  networkRequests?: Array<{
    url?: string;
    status?: number;
    method?: string;
    error?: string;
    [key: string]: unknown;
  }>
): {
  timestamp: string;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    networkErrors: number;
  };
  errors: ConsoleMessage[];
  warnings: ConsoleMessage[];
  networkErrors: Array<{
    url: string;
    status: number;
    method: string;
    error?: string;
  }>;
  analysis: {
    errorTypes: Map<string, number>;
    commonErrors: Array<{ message: string; count: number }>;
    suggestedFixes: string[];
  };
  recommendations: string[];
} {
  const analysis = analyzeConsoleErrors(consoleMessages);

  // 네트워크 에러 필터링
  const networkErrors: Array<{
    url: string;
    status: number;
    method: string;
    error?: string;
  }> = [];

  if (networkRequests) {
    networkRequests.forEach((req) => {
      const status = req.status || 0;
      if (status >= 400 || req.error) {
        networkErrors.push({
          url: req.url || 'unknown',
          status,
          method: (req.method || 'GET').toUpperCase(),
          error: req.error ? String(req.error) : undefined,
        });
      }
    });
  }

  // 종합 권장사항
  const recommendations: string[] = [...analysis.analysis.suggestedFixes];

  if (networkErrors.length > 0) {
    recommendations.push('네트워크 에러 발견: API 엔드포인트 상태 확인 필요');
  }

  if (analysis.errors.length > 0) {
    recommendations.push('콘솔 에러 발견: 브라우저 개발자 도구에서 상세 정보 확인');
  }

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: analysis.errors.length,
      totalWarnings: analysis.warnings.length,
      networkErrors: networkErrors.length,
    },
    errors: analysis.errors,
    warnings: analysis.warnings,
    networkErrors,
    analysis: analysis.analysis,
    recommendations: Array.from(new Set(recommendations)),
  };
}

/**
 * Browser MCP 툴 사용 가이드 출력
 */
export function printBrowserMCPGuide(): void {
  const tools = getBrowserMCPTools();
  const workflow = createAdminAccessWorkflow('http://localhost:3000', 'YOUR_PASSWORD');

  console.log('\n=== Browser MCP 툴 사용 가이드 ===\n');
  console.log('사용 가능한 Browser MCP 툴:\n');

  tools.forEach((tool) => {
    console.log(`📌 ${tool.name}`);
    console.log(`   설명: ${tool.description}`);
    console.log(`   파라미터:`);
    tool.parameters.forEach((param) => {
      console.log(`     - ${param.name} (${param.type}): ${param.description}${param.required ? ' [필수]' : ' [선택]'}`);
    });
    console.log(`   예제: ${tool.example}\n`);
  });

  console.log('\n=== 관리자 페이지 접속 워크플로우 ===\n');
  workflow.forEach((step) => {
    console.log(`단계 ${step.step}: ${step.description}`);
    console.log(`  툴: ${step.tool}`);
    console.log(`  파라미터: ${JSON.stringify(step.parameters, null, 2)}`);
    console.log(`  예상 결과: ${step.expectedResult}\n`);
  });
}

