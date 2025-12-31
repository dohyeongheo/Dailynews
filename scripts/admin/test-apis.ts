#!/usr/bin/env node
/**
 * 관리자 페이지 자동화 API 테스트 스크립트
 * 로컬 환경에서 API 엔드포인트를 테스트합니다.
 */

import 'dotenv/config';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function testConsoleErrorsAPI() {
  console.log('\n=== 콘솔 에러 API 테스트 ===');

  try {
    // 먼저 로그인
    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });

    if (!loginResponse.ok) {
      throw new Error('로그인 실패');
    }

    const loginData = await loginResponse.json();
    console.log('✅ 로그인 성공');

    // 쿠키 가져오기
    const cookies = loginResponse.headers.get('set-cookie') || '';

    // 콘솔 에러 조회 API 테스트
    const consoleErrorsResponse = await fetch(`${BASE_URL}/api/admin/console-errors?level=error,warning`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    });

    if (!consoleErrorsResponse.ok) {
      throw new Error(`콘솔 에러 API 실패: ${consoleErrorsResponse.status}`);
    }

    const consoleErrorsData = await consoleErrorsResponse.json();
    console.log('✅ 콘솔 에러 API 응답 성공');
    console.log('응답 데이터:', JSON.stringify(consoleErrorsData, null, 2));

    // 콘솔 에러 분석 API 테스트
    const analyzeResponse = await fetch(`${BASE_URL}/api/admin/console-errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify({
        messages: [
          {
            level: 'error',
            message: 'Test error message',
            timestamp: Date.now(),
            source: 'test',
          },
        ],
      }),
    });

    if (!analyzeResponse.ok) {
      throw new Error(`콘솔 에러 분석 API 실패: ${analyzeResponse.status}`);
    }

    const analyzeData = await analyzeResponse.json();
    console.log('✅ 콘솔 에러 분석 API 응답 성공');
    console.log('분석 결과:', JSON.stringify(analyzeData, null, 2));

    return true;
  } catch (error) {
    console.error('❌ 콘솔 에러 API 테스트 실패:', error);
    return false;
  }
}

async function testMonitorAPI() {
  console.log('\n=== 모니터링 API 테스트 ===');

  try {
    // 먼저 로그인
    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });

    if (!loginResponse.ok) {
      throw new Error('로그인 실패');
    }

    const cookies = loginResponse.headers.get('set-cookie') || '';

    // 모니터링 API 테스트
    const monitorResponse = await fetch(`${BASE_URL}/api/admin/monitor`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    });

    if (!monitorResponse.ok) {
      throw new Error(`모니터링 API 실패: ${monitorResponse.status}`);
    }

    const monitorData = await monitorResponse.json();
    console.log('✅ 모니터링 API 응답 성공');
    console.log('응답 데이터:', JSON.stringify(monitorData, null, 2));

    // 탭별 에러 확인 API 테스트
    const tabsResponse = await fetch(`${BASE_URL}/api/admin/monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify({
        tabs: ['news', 'users', 'monitoring'],
      }),
    });

    if (!tabsResponse.ok) {
      throw new Error(`탭별 에러 확인 API 실패: ${tabsResponse.status}`);
    }

    const tabsData = await tabsResponse.json();
    console.log('✅ 탭별 에러 확인 API 응답 성공');
    console.log('응답 데이터:', JSON.stringify(tabsData, null, 2));

    return true;
  } catch (error) {
    console.error('❌ 모니터링 API 테스트 실패:', error);
    return false;
  }
}

async function main() {
  console.log('관리자 페이지 자동화 API 테스트 시작');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Admin Password: ${ADMIN_PASSWORD ? '설정됨' : '설정되지 않음'}`);

  if (!ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  const results = {
    consoleErrors: false,
    monitor: false,
  };

  // 콘솔 에러 API 테스트
  results.consoleErrors = await testConsoleErrorsAPI();

  // 모니터링 API 테스트
  results.monitor = await testMonitorAPI();

  // 결과 요약
  console.log('\n=== 테스트 결과 요약 ===');
  console.log(`콘솔 에러 API: ${results.consoleErrors ? '✅ 통과' : '❌ 실패'}`);
  console.log(`모니터링 API: ${results.monitor ? '✅ 통과' : '❌ 실패'}`);

  const allPassed = Object.values(results).every((r) => r);
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}

