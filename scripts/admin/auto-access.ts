#!/usr/bin/env node
/**
 * 관리자 페이지 자동 접속 스크립트
 * Browser MCP 서버를 사용하여 관리자 페이지에 자동으로 접속하고 콘솔 에러를 확인합니다.
 */

import 'dotenv/config';
import {
  accessAdminPage,
  collectConsoleErrors,
  checkPageHealth,
  takeScreenshot,
  getVercelDeploymentUrl,
  type AdminAccessResult,
  type ConsoleMessage,
  type PageHealth,
} from '@/lib/utils/browser-automation';
import { log } from '@/lib/utils/logger';

/**
 * 관리자 페이지 자동 접속 및 에러 확인
 */
async function main() {
  try {
    log.info('관리자 페이지 자동 접속 스크립트 시작');

    // 1. Vercel 배포 URL 조회
    const baseUrl = await getVercelDeploymentUrl();
    if (!baseUrl) {
      log.error('Vercel 배포 URL을 찾을 수 없습니다.');
      process.exit(1);
    }
    log.info('배포 URL 확인', { baseUrl });

    // 2. 관리자 비밀번호 확인
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
      log.error('ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.');
      process.exit(1);
    }

    // 3. 관리자 페이지 접속
    log.info('관리자 페이지 접속 시도', { url: `${baseUrl}/admin/login` });
    const accessResult: AdminAccessResult = await accessAdminPage(baseUrl, password);

    if (!accessResult.success) {
      log.error('관리자 페이지 접속 실패', { error: accessResult.error });
      process.exit(1);
    }

    log.info('관리자 페이지 접속 성공', { url: accessResult.url });

    // 4. 콘솔 에러 수집
    log.info('콘솔 에러 수집 시작');
    const consoleErrors = await collectConsoleErrors(['error', 'warning']);

    if (consoleErrors.length > 0) {
      log.warn('콘솔 에러 발견', { count: consoleErrors.length });
      consoleErrors.forEach((error, index) => {
        log.warn(`에러 ${index + 1}`, {
          level: error.level,
          message: error.message,
          source: error.source,
          stack: error.stack,
        });
      });
    } else {
      log.info('콘솔 에러 없음');
    }

    // 5. 페이지 상태 확인
    log.info('페이지 상태 확인 시작');
    const pageHealth: PageHealth = await checkPageHealth(`${baseUrl}/admin`);

    log.info('페이지 상태 확인 완료', {
      status: pageHealth.status,
      consoleErrors: pageHealth.consoleErrors.length,
      consoleWarnings: pageHealth.consoleWarnings.length,
      networkErrors: pageHealth.networkErrors.length,
      loadTime: pageHealth.loadTime,
    });

    // 6. 스크린샷 캡처 (선택사항)
    if (process.env.CAPTURE_SCREENSHOT === 'true') {
      log.info('스크린샷 캡처 시작');
      const screenshot = await takeScreenshot();
      if (screenshot) {
        log.info('스크린샷 캡처 완료', { length: screenshot.length });
      } else {
        log.warn('스크린샷 캡처 실패');
      }
    }

    // 7. 결과 요약
    const hasErrors = pageHealth.consoleErrors.length > 0 || pageHealth.networkErrors.length > 0;
    const hasWarnings = pageHealth.consoleWarnings.length > 0;

    console.log('\n=== 관리자 페이지 접속 결과 ===');
    console.log(`URL: ${accessResult.url}`);
    console.log(`상태: ${pageHealth.status}`);
    console.log(`콘솔 에러: ${pageHealth.consoleErrors.length}개`);
    console.log(`콘솔 경고: ${pageHealth.consoleWarnings.length}개`);
    console.log(`네트워크 에러: ${pageHealth.networkErrors.length}개`);
    if (pageHealth.loadTime) {
      console.log(`로드 시간: ${pageHealth.loadTime}ms`);
    }

    if (hasErrors) {
      console.log('\n⚠️  에러가 발견되었습니다.');
      process.exit(1);
    } else if (hasWarnings) {
      console.log('\n⚠️  경고가 발견되었습니다.');
      process.exit(0);
    } else {
      console.log('\n✅ 모든 검사 통과');
      process.exit(0);
    }
  } catch (error) {
    log.error('스크립트 실행 중 오류 발생', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}





