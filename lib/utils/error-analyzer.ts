/**
 * 에러 분석 및 원인 파악 로직
 * 콘솔 에러를 분석하고 원인을 파악하여 해결 방안을 제시합니다.
 */

import { log } from './logger';
import type { ConsoleMessage } from './browser-automation';

/**
 * 에러 패턴 정의
 */
interface ErrorPattern {
  pattern: RegExp;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  solution: string;
  relatedFiles?: string[];
}

/**
 * 에러 패턴 데이터베이스
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /Failed to fetch|NetworkError|ERR_NETWORK|ERR_INTERNET_DISCONNECTED/i,
    category: 'Network Error',
    severity: 'high',
    description: '네트워크 요청 실패',
    solution: 'API 엔드포인트 확인, CORS 설정 확인, 네트워크 연결 상태 확인',
    relatedFiles: ['app/api/**/*.ts', 'lib/utils/api-middleware.ts'],
  },
  {
    pattern: /Cannot read propert(y|ies)|Cannot read|TypeError.*undefined/i,
    category: 'Null/Undefined Reference',
    severity: 'critical',
    description: 'null 또는 undefined 참조 오류',
    solution: '옵셔널 체이닝(?.) 사용, 기본값 설정, null 체크 추가',
    relatedFiles: ['components/**/*.tsx', 'lib/**/*.ts'],
  },
  {
    pattern: /is not defined|ReferenceError/i,
    category: 'Undefined Variable',
    severity: 'high',
    description: '정의되지 않은 변수 또는 함수 사용',
    solution: 'import 문 확인, 변수 선언 확인, 스코프 확인',
    relatedFiles: ['components/**/*.tsx', 'lib/**/*.ts', 'app/**/*.ts'],
  },
  {
    pattern: /Unexpected token|SyntaxError|Parse error/i,
    category: 'Syntax Error',
    severity: 'critical',
    description: '구문 오류',
    solution: '코드 문법 확인, 괄호/따옴표 매칭 확인, TypeScript 타입 오류 확인',
    relatedFiles: ['**/*.ts', '**/*.tsx'],
  },
  {
    pattern: /ERR_BLOCKED_BY_CLIENT|net::ERR_BLOCKED/i,
    category: 'Client Blocking',
    severity: 'medium',
    description: '클라이언트에 의해 요청이 차단됨',
    solution: '브라우저 확장 프로그램 확인, CORS 정책 확인, CSRF 토큰 확인',
    relatedFiles: ['middleware.ts', 'lib/utils/csrf.ts'],
  },
  {
    pattern: /404|Not Found|Resource not found/i,
    category: 'Resource Not Found',
    severity: 'high',
    description: '리소스를 찾을 수 없음',
    solution: '파일 경로 확인, API 엔드포인트 확인, 라우팅 설정 확인',
    relatedFiles: ['app/**/route.ts', 'app/**/page.tsx'],
  },
  {
    pattern: /401|Unauthorized|Authentication failed/i,
    category: 'Authentication Error',
    severity: 'high',
    description: '인증 실패',
    solution: '세션 쿠키 확인, 인증 토큰 확인, 로그인 상태 확인',
    relatedFiles: ['lib/utils/admin-auth.ts', 'app/api/admin/auth/route.ts'],
  },
  {
    pattern: /403|Forbidden|Access denied/i,
    category: 'Authorization Error',
    severity: 'high',
    description: '권한 없음',
    solution: '권한 확인, 관리자 인증 확인, RLS 정책 확인',
    relatedFiles: ['lib/utils/admin-auth.ts', 'middleware.ts'],
  },
  {
    pattern: /500|Internal Server Error|Server error/i,
    category: 'Server Error',
    severity: 'critical',
    description: '서버 내부 오류',
    solution: '서버 로그 확인, 에러 핸들링 개선, 예외 처리 추가',
    relatedFiles: ['app/api/**/*.ts', 'lib/**/*.ts'],
  },
  {
    pattern: /CORS|Cross-Origin|Access-Control/i,
    category: 'CORS Error',
    severity: 'high',
    description: 'CORS 정책 위반',
    solution: 'CORS 설정 확인, 허용된 Origin 확인, preflight 요청 처리 확인',
    relatedFiles: ['middleware.ts', 'next.config.js'],
  },
  {
    pattern: /Hydration|hydration failed|Text content does not match/i,
    category: 'Hydration Error',
    severity: 'high',
    description: 'React Hydration 오류',
    solution: '서버/클라이언트 렌더링 불일치 확인, useEffect 사용 확인',
    relatedFiles: ['components/**/*.tsx', 'app/**/*.tsx'],
  },
  {
    pattern: /Maximum update depth exceeded|Too many re-renders/i,
    category: 'Infinite Loop',
    severity: 'critical',
    description: '무한 렌더링 루프',
    solution: 'useEffect 의존성 배열 확인, 상태 업데이트 로직 확인',
    relatedFiles: ['components/**/*.tsx'],
  },
  {
    pattern: /Module not found|Cannot find module/i,
    category: 'Module Error',
    severity: 'high',
    description: '모듈을 찾을 수 없음',
    solution: 'import 경로 확인, 패키지 설치 확인, tsconfig.json 경로 설정 확인',
    relatedFiles: ['**/*.ts', '**/*.tsx', 'package.json'],
  },
];

/**
 * 에러 분석 결과
 */
export interface ErrorAnalysisResult {
  error: ConsoleMessage;
  matchedPatterns: ErrorPattern[];
  primaryPattern: ErrorPattern | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestedFiles: string[];
  solution: string;
  confidence: number; // 0-1 사이의 신뢰도
}

/**
 * 스택 트레이스에서 파일 경로 추출
 */
export function extractFilePathsFromStack(stack?: string): string[] {
  if (!stack) return [];

  const filePaths: string[] = [];
  const pathPattern = /(?:file:\/\/|https?:\/\/[^\/]+)(\/[^\s:]+)/g;
  const relativePathPattern = /([a-zA-Z0-9_\-/]+\.(ts|tsx|js|jsx))(?::\d+:\d+)?/g;

  // 절대 경로 추출
  let match;
  while ((match = pathPattern.exec(stack)) !== null) {
    const path = match[1];
    if (path && !filePaths.includes(path)) {
      filePaths.push(path);
    }
  }

  // 상대 경로 추출
  while ((match = relativePathPattern.exec(stack)) !== null) {
    const path = match[1];
    if (path && !filePaths.includes(path) && !path.startsWith('node_modules')) {
      filePaths.push(path);
    }
  }

  return filePaths;
}

/**
 * 에러 메시지에서 파일 경로 추출
 */
export function extractFilePathsFromMessage(message: string): string[] {
  const filePaths: string[] = [];
  const patterns = [
    /([a-zA-Z0-9_\-/]+\.(ts|tsx|js|jsx))(?::\d+:\d+)?/g,
    /at\s+([a-zA-Z0-9_\-/]+\.(ts|tsx|js|jsx))/g,
    /in\s+([a-zA-Z0-9_\-/]+\.(ts|tsx|js|jsx))/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const path = match[1];
      if (path && !filePaths.includes(path) && !path.startsWith('node_modules')) {
        filePaths.push(path);
      }
    }
  });

  return filePaths;
}

/**
 * 단일 에러 분석
 */
export function analyzeError(error: ConsoleMessage): ErrorAnalysisResult {
  const matchedPatterns: ErrorPattern[] = [];
  const message = error.message || '';
  const stack = error.stack || '';

  // 에러 패턴 매칭
  ERROR_PATTERNS.forEach((pattern) => {
    if (pattern.pattern.test(message) || pattern.pattern.test(stack)) {
      matchedPatterns.push(pattern);
    }
  });

  // 가장 심각한 패턴 선택
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const primaryPattern = matchedPatterns.length > 0
    ? matchedPatterns.reduce((prev, curr) =>
        severityOrder[prev.severity] < severityOrder[curr.severity] ? prev : curr
      )
    : null;

  // 파일 경로 추출
  const stackFiles = extractFilePathsFromStack(stack);
  const messageFiles = extractFilePathsFromMessage(message);
  const patternFiles = primaryPattern?.relatedFiles || [];
  const suggestedFiles = Array.from(new Set([...stackFiles, ...messageFiles, ...patternFiles]));

  // 해결 방안 생성
  const solutions = matchedPatterns.map((p) => p.solution);
  const uniqueSolutions = Array.from(new Set(solutions));
  const solution = uniqueSolutions.length > 0
    ? uniqueSolutions.join(' | ')
    : '에러 로그를 확인하고 관련 코드를 검토하세요.';

  // 신뢰도 계산
  const confidence = matchedPatterns.length > 0
    ? Math.min(0.9, 0.5 + matchedPatterns.length * 0.1)
    : 0.3;

  return {
    error,
    matchedPatterns,
    primaryPattern,
    severity: primaryPattern?.severity || 'medium',
    suggestedFiles,
    solution,
    confidence,
  };
}

/**
 * 여러 에러 분석
 */
export function analyzeErrors(errors: ConsoleMessage[]): {
  analyses: ErrorAnalysisResult[];
  summary: {
    totalErrors: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    commonFiles: string[];
  };
  recommendations: string[];
} {
  const analyses = errors.map((error) => analyzeError(error));

  // 요약 통계
  const bySeverity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const byCategory: Record<string, number> = {};
  const fileCounts: Record<string, number> = {};

  analyses.forEach((analysis) => {
    bySeverity[analysis.severity]++;
    if (analysis.primaryPattern) {
      const category = analysis.primaryPattern.category;
      byCategory[category] = (byCategory[category] || 0) + 1;
    }
    analysis.suggestedFiles.forEach((file) => {
      fileCounts[file] = (fileCounts[file] || 0) + 1;
    });
  });

  // 자주 나타나는 파일
  const commonFiles = Object.entries(fileCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file]) => file);

  // 권장사항 생성
  const recommendations: string[] = [];

  if (bySeverity.critical > 0) {
    recommendations.push('심각한 오류가 발견되었습니다. 즉시 확인이 필요합니다.');
  }

  if (bySeverity.high > 0) {
    recommendations.push('높은 우선순위 오류가 발견되었습니다. 우선적으로 해결하세요.');
  }

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    recommendations.push(`가장 많이 발생한 오류 유형: ${topCategory[0]} (${topCategory[1]}건)`);
  }

  if (commonFiles.length > 0) {
    recommendations.push(`자주 수정되는 파일: ${commonFiles.slice(0, 3).join(', ')}`);
  }

  // 각 분석의 해결 방안 추가
  analyses.forEach((analysis) => {
    if (analysis.solution && !recommendations.includes(analysis.solution)) {
      recommendations.push(analysis.solution);
    }
  });

  return {
    analyses,
    summary: {
      totalErrors: errors.length,
      bySeverity,
      byCategory,
      commonFiles,
    },
    recommendations: Array.from(new Set(recommendations)),
  };
}

/**
 * 에러 리포트 생성 (상세)
 */
export function generateDetailedErrorReport(
  errors: ConsoleMessage[],
  warnings: ConsoleMessage[] = []
): {
  timestamp: string;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    criticalErrors: number;
    highPriorityErrors: number;
  };
  errorAnalyses: ErrorAnalysisResult[];
  warnings: ConsoleMessage[];
  recommendations: string[];
  nextSteps: string[];
} {
  const analysis = analyzeErrors(errors);

  const criticalErrors = analysis.analyses.filter((a) => a.severity === 'critical').length;
  const highPriorityErrors = analysis.analyses.filter((a) => a.severity === 'high').length;

  const nextSteps: string[] = [];

  if (criticalErrors > 0) {
    nextSteps.push('1. 심각한 오류부터 해결하세요.');
    nextSteps.push('2. 관련 파일을 확인하고 코드를 수정하세요.');
  } else if (highPriorityErrors > 0) {
    nextSteps.push('1. 높은 우선순위 오류를 해결하세요.');
    nextSteps.push('2. 에러 분석 결과를 참고하여 수정하세요.');
  } else if (errors.length > 0) {
    nextSteps.push('1. 에러 로그를 확인하세요.');
    nextSteps.push('2. 에러 분석 결과를 참고하여 수정하세요.');
  } else {
    nextSteps.push('1. 경고 메시지를 확인하세요.');
    nextSteps.push('2. 필요시 코드를 개선하세요.');
  }

  nextSteps.push('3. 수정 후 다시 테스트하세요.');

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      criticalErrors,
      highPriorityErrors,
    },
    errorAnalyses: analysis.analyses,
    warnings,
    recommendations: analysis.recommendations,
    nextSteps,
  };
}




