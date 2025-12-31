#!/usr/bin/env node
/**
 * 관리자 페이지 에러 확인 CLI
 * AI 에이전트가 실행할 수 있는 명령어로 관리자 페이지의 에러를 확인합니다.
 */

import 'dotenv/config';
import {
  accessAdminPage,
  collectConsoleErrors,
  checkPageHealth,
  getVercelDeploymentUrl,
  type AdminAccessResult,
  type ConsoleMessage,
  type PageHealth,
} from '@/lib/utils/browser-automation';
import { log } from '@/lib/utils/logger';

/**
 * 에러 리포트 생성
 */
interface ErrorReport {
  timestamp: string;
  url: string;
  status: 'healthy' | 'error' | 'warning';
  errors: ConsoleMessage[];
  warnings: ConsoleMessage[];
  networkErrors: PageHealth['networkErrors'];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    totalNetworkErrors: number;
  };
  recommendations: string[];
}

function generateErrorReport(
  pageHealth: PageHealth,
  consoleErrors: ConsoleMessage[]
): ErrorReport {
  const errors = consoleErrors.filter((e) => e.level === 'error');
  const warnings = consoleErrors.filter((e) => e.level === 'warning');

  const recommendations: string[] = [];

  // 에러 타입별 권장사항
  errors.forEach((error) => {
    if (error.message.includes('Failed to fetch')) {
      recommendations.push('네트워크 요청 실패: API 엔드포인트 확인 및 CORS 설정 확인');
    } else if (error.message.includes('Cannot read property')) {
      recommendations.push('null/undefined 참조 오류: 옵셔널 체이닝 또는 기본값 설정');
    } else if (error.message.includes('is not defined')) {
      recommendations.push('정의되지 않은 변수: import 문 또는 변수 선언 확인');
    } else if (error.message.includes('Unexpected token')) {
      recommendations.push('구문 오류: 코드 문법 확인');
    }
  });

  if (pageHealth.networkErrors.length > 0) {
    recommendations.push('네트워크 에러 발견: API 엔드포인트 상태 확인 필요');
  }

  // 중복 제거
  const uniqueRecommendations = Array.from(new Set(recommendations));

  return {
    timestamp: new Date().toISOString(),
    url: pageHealth.url,
    status: pageHealth.status,
    errors,
    warnings,
    networkErrors: pageHealth.networkErrors,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalNetworkErrors: pageHealth.networkErrors.length,
    },
    recommendations: uniqueRecommendations,
  };
}

/**
 * 에러 리포트 출력
 */
function printErrorReport(report: ErrorReport) {
  console.log('\n' + '='.repeat(60));
  console.log('관리자 페이지 에러 리포트');
  console.log('='.repeat(60));
  console.log(`시간: ${report.timestamp}`);
  console.log(`URL: ${report.url}`);
  console.log(`상태: ${report.status}`);
  console.log('\n--- 요약 ---');
  console.log(`에러: ${report.summary.totalErrors}개`);
  console.log(`경고: ${report.summary.totalWarnings}개`);
  console.log(`네트워크 에러: ${report.summary.totalNetworkErrors}개`);

  if (report.errors.length > 0) {
    console.log('\n--- 에러 목록 ---');
    report.errors.forEach((error, index) => {
      console.log(`\n[${index + 1}] ${error.level.toUpperCase()}: ${error.message}`);
      if (error.source) {
        console.log(`    출처: ${error.source}`);
      }
      if (error.stack) {
        console.log(`    스택:\n${error.stack.split('\n').slice(0, 5).join('\n')}`);
      }
    });
  }

  if (report.warnings.length > 0) {
    console.log('\n--- 경고 목록 ---');
    report.warnings.forEach((warning, index) => {
      console.log(`\n[${index + 1}] ${warning.level.toUpperCase()}: ${warning.message}`);
      if (warning.source) {
        console.log(`    출처: ${warning.source}`);
      }
    });
  }

  if (report.networkErrors.length > 0) {
    console.log('\n--- 네트워크 에러 목록 ---');
    report.networkErrors.forEach((error, index) => {
      console.log(`\n[${index + 1}] ${error.method} ${error.url}`);
      console.log(`    상태: ${error.status}`);
      if (error.error) {
        console.log(`    오류: ${error.error}`);
      }
    });
  }

  if (report.recommendations.length > 0) {
    console.log('\n--- 권장사항 ---');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * 메인 함수
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0] || 'check';

    log.info('관리자 페이지 에러 확인 CLI 시작', { command });

    switch (command) {
      case 'check':
      case 'errors': {
        // 1. Vercel 배포 URL 조회
        const baseUrl = await getVercelDeploymentUrl();
        if (!baseUrl) {
          log.error('Vercel 배포 URL을 찾을 수 없습니다.');
          process.exit(1);
        }

        // 2. 관리자 비밀번호 확인
        const password = process.env.ADMIN_PASSWORD;
        if (!password) {
          log.error('ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.');
          process.exit(1);
        }

        // 3. 관리자 페이지 접속
        log.info('관리자 페이지 접속 시도');
        const accessResult: AdminAccessResult = await accessAdminPage(baseUrl, password);

        if (!accessResult.success) {
          log.error('관리자 페이지 접속 실패', { error: accessResult.error });
          process.exit(1);
        }

        // 4. 콘솔 에러 수집
        log.info('콘솔 에러 수집');
        const consoleErrors = await collectConsoleErrors(['error', 'warning']);

        // 5. 페이지 상태 확인
        log.info('페이지 상태 확인');
        const pageHealth: PageHealth = await checkPageHealth(`${baseUrl}/admin`);

        // 6. 에러 리포트 생성
        const report = generateErrorReport(pageHealth, consoleErrors);

        // 7. 리포트 출력
        printErrorReport(report);

        // 8. 종료 코드 결정
        if (report.summary.totalErrors > 0 || report.summary.totalNetworkErrors > 0) {
          process.exit(1);
        } else if (report.summary.totalWarnings > 0) {
          process.exit(0); // 경고만 있는 경우는 성공으로 처리
        } else {
          process.exit(0);
        }
        break;
      }

      case 'health': {
        const baseUrl = await getVercelDeploymentUrl();
        if (!baseUrl) {
          log.error('Vercel 배포 URL을 찾을 수 없습니다.');
          process.exit(1);
        }

        const pageHealth = await checkPageHealth(`${baseUrl}/admin`);

        console.log('\n=== 페이지 상태 ===');
        console.log(`URL: ${pageHealth.url}`);
        console.log(`상태: ${pageHealth.status}`);
        console.log(`로드 시간: ${pageHealth.loadTime || 'N/A'}ms`);
        console.log(`콘솔 에러: ${pageHealth.consoleErrors.length}개`);
        console.log(`콘솔 경고: ${pageHealth.consoleWarnings.length}개`);
        console.log(`네트워크 에러: ${pageHealth.networkErrors.length}개`);

        process.exit(pageHealth.status === 'healthy' ? 0 : 1);
        break;
      }

      case 'help':
      default: {
        console.log(`
관리자 페이지 에러 확인 CLI

사용법:
  npm run admin:check-errors [command]

명령어:
  check, errors    관리자 페이지 접속 및 에러 확인 (기본값)
  health          페이지 상태만 확인
  help            이 도움말 표시

환경 변수:
  ADMIN_PASSWORD      관리자 비밀번호 (필수)
  NEXT_PUBLIC_VERCEL_URL  또는 VERCEL_URL  배포 URL (선택)

예제:
  npm run admin:check-errors
  npm run admin:check-errors health
        `);
        process.exit(0);
      }
    }
  } catch (error) {
    log.error('CLI 실행 중 오류 발생', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

