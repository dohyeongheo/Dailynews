#!/usr/bin/env node
/**
 * AI 에이전트용 통합 워크플로우 스크립트
 * AI 에이전트가 Browser MCP 툴을 사용하여 관리자 페이지에 접속하고 에러를 확인하는 가이드를 제공합니다.
 */

import 'dotenv/config';
import {
  getBrowserMCPTools,
  createAdminAccessWorkflow,
  printBrowserMCPGuide,
  generateErrorReport,
  analyzeConsoleErrors,
} from '@/lib/utils/browser-mcp-direct';
import { generateDetailedErrorReport } from '@/lib/utils/error-analyzer';
import { getVercelDeploymentUrl } from '@/lib/utils/browser-automation';
import { log } from '@/lib/utils/logger';

/**
 * AI 에이전트 워크플로우 가이드 출력
 */
function printWorkflowGuide() {
  console.log('\n' + '='.repeat(80));
  console.log('AI 에이전트 Browser MCP 워크플로우 가이드');
  console.log('='.repeat(80) + '\n');

  console.log('이 스크립트는 AI 에이전트가 Browser MCP 툴을 사용하여 관리자 페이지에');
  console.log('접속하고 콘솔 에러를 확인하는 방법을 안내합니다.\n');

  console.log('📋 워크플로우 개요:');
  console.log('1. Browser MCP 툴로 관리자 로그인 페이지 접속');
  console.log('2. 페이지 구조 분석 및 로그인 폼 요소 찾기');
  console.log('3. 비밀번호 입력 및 로그인');
  console.log('4. 관리자 페이지 접속');
  console.log('5. 콘솔 에러 확인 및 수집');
  console.log('6. 네트워크 요청 확인');
  console.log('7. 에러 분석 및 원인 파악');
  console.log('8. 해결 방안 제시\n');

  // Browser MCP 툴 가이드 출력
  printBrowserMCPGuide();

  // 관리자 페이지 접속 워크플로우 출력
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const password = process.env.ADMIN_PASSWORD || 'YOUR_PASSWORD';

  console.log('\n' + '='.repeat(80));
  console.log('관리자 페이지 접속 워크플로우 (단계별 가이드)');
  console.log('='.repeat(80) + '\n');

  const workflow = createAdminAccessWorkflow(baseUrl, password);

  workflow.forEach((step) => {
    console.log(`\n[단계 ${step.step}] ${step.description}`);
    console.log(`  📌 사용할 툴: ${step.tool}`);
    console.log(`  📝 파라미터:`);
    console.log(`     ${JSON.stringify(step.parameters, null, 6).replace(/\n/g, '\n     ')}`);
    console.log(`  ✅ 예상 결과: ${step.expectedResult}`);

    // 특별 안내
    if (step.step === 2) {
      console.log(`\n  ⚠️  중요: browser_snapshot 결과에서 다음 요소의 ref를 찾아야 합니다:`);
      console.log(`     - 비밀번호 입력 필드: input[type="password"] 또는 "비밀번호" 텍스트가 있는 input`);
      console.log(`     - 로그인 버튼: button[type="submit"] 또는 "로그인" 텍스트가 있는 button`);
    }

    if (step.step === 3 || step.step === 4) {
      console.log(`\n  ⚠️  중요: step 2에서 얻은 실제 ref 값으로 교체해야 합니다.`);
      console.log(`     예: INPUT_REF_FROM_SNAPSHOT → 실제 ref 값 (예: "input-123")`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('에러 분석 및 해결 프로세스');
  console.log('='.repeat(80) + '\n');

  console.log('Browser MCP로 콘솔 메시지를 수집한 후:\n');

  console.log('1. 에러 분석:');
  console.log('   - analyzeConsoleErrors() 함수를 사용하여 에러를 분석합니다.');
  console.log('   - 에러 타입별 분류, 스택 트레이스 분석, 관련 파일 경로 추출\n');

  console.log('2. 원인 파악:');
  console.log('   - generateDetailedErrorReport() 함수를 사용하여 상세 리포트를 생성합니다.');
  console.log('   - 에러 패턴 매칭, 심각도 평가, 해결 방안 제시\n');

  console.log('3. 해결 방안 제시:');
  console.log('   - 에러 분석 결과를 바탕으로 구체적인 해결 방안을 제시합니다.');
  console.log('   - 관련 파일 경로, 수정 방법, 예상 결과를 포함합니다.\n');

  console.log('='.repeat(80) + '\n');
}

/**
 * 에러 분석 예제 출력
 */
function printErrorAnalysisExample() {
  console.log('\n' + '='.repeat(80));
  console.log('에러 분석 예제');
  console.log('='.repeat(80) + '\n');

  // 예제 콘솔 메시지
  const exampleConsoleMessages = [
    {
      level: 'error',
      text: 'Failed to fetch: http://localhost:3000/api/admin/metrics',
      type: 'error',
    },
    {
      level: 'error',
      text: "Cannot read properties of undefined (reading 'map')",
      type: 'error',
    },
    {
      level: 'warning',
      text: '페이지뷰 추적 실패 (네트워크 오류)',
      type: 'warning',
    },
  ];

  console.log('예제 콘솔 메시지:');
  console.log(JSON.stringify(exampleConsoleMessages, null, 2));
  console.log('\n');

  // 에러 분석
  const analysis = analyzeConsoleErrors(exampleConsoleMessages);

  console.log('분석 결과:');
  console.log(`  - 총 에러: ${analysis.analysis.totalErrors}개`);
  console.log(`  - 총 경고: ${analysis.analysis.totalWarnings}개`);
  console.log(`  - 에러 유형: ${Array.from(analysis.analysis.errorTypes.keys()).join(', ')}`);
  console.log(`  - 해결 방안:`);
  analysis.analysis.suggestedFixes.forEach((fix, index) => {
    console.log(`    ${index + 1}. ${fix}`);
  });

  console.log('\n');

  // 상세 리포트 생성
  const report = generateErrorReport(exampleConsoleMessages);

  console.log('에러 리포트:');
  console.log(JSON.stringify(report, null, 2));
  console.log('\n');
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'guide';

  log.info('AI 에이전트 워크플로우 스크립트 시작', { command });

  switch (command) {
    case 'guide':
    case 'workflow': {
      printWorkflowGuide();
      break;
    }

    case 'example':
    case 'demo': {
      printErrorAnalysisExample();
      break;
    }

    case 'tools': {
      const tools = getBrowserMCPTools();
      console.log('\n사용 가능한 Browser MCP 툴:\n');
      tools.forEach((tool) => {
        console.log(`- ${tool.name}`);
        console.log(`  ${tool.description}\n`);
      });
      break;
    }

    case 'help':
    default: {
      console.log(`
AI 에이전트 Browser MCP 워크플로우 스크립트

사용법:
  npm run admin:ai-workflow [command]

명령어:
  guide, workflow    워크플로우 가이드 출력 (기본값)
  example, demo      에러 분석 예제 출력
  tools              사용 가능한 Browser MCP 툴 목록 출력
  help               이 도움말 표시

예제:
  npm run admin:ai-workflow
  npm run admin:ai-workflow example
  npm run admin:ai-workflow tools

환경 변수:
  ADMIN_PASSWORD           관리자 비밀번호 (워크플로우 예제에 사용)
  NEXT_PUBLIC_VERCEL_URL   또는 VERCEL_URL  배포 URL (워크플로우 예제에 사용)
      `);
      break;
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch((error) => {
    log.error('스크립트 실행 중 오류 발생', error);
    process.exit(1);
  });
}




