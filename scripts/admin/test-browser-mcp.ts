#!/usr/bin/env node
/**
 * Browser MCP 사용 테스트 스크립트
 * Browser MCP 툴 사용을 테스트하고 워크플로우를 검증합니다.
 */

import 'dotenv/config';
import {
  getBrowserMCPTools,
  createAdminAccessWorkflow,
  analyzeConsoleErrors,
  generateErrorReport,
} from '@/lib/utils/browser-mcp-direct';
import { generateDetailedErrorReport } from '@/lib/utils/error-analyzer';
import { getVercelDeploymentUrl } from '@/lib/utils/browser-automation';
import { log } from '@/lib/utils/logger';

/**
 * Browser MCP 툴 사용 가능 여부 확인
 */
function testBrowserMCPTools() {
  console.log('\n=== Browser MCP 툴 사용 가능 여부 확인 ===\n');

  const tools = getBrowserMCPTools();
  console.log(`✅ 사용 가능한 Browser MCP 툴: ${tools.length}개\n`);

  tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name}`);
    console.log(`   설명: ${tool.description}`);
    console.log(`   파라미터: ${tool.parameters.length}개`);
    console.log('');
  });

  return tools.length > 0;
}

/**
 * 워크플로우 단계별 검증
 */
function testWorkflowSteps() {
  console.log('\n=== 워크플로우 단계별 검증 ===\n');

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const password = process.env.ADMIN_PASSWORD || 'TEST_PASSWORD';

  const workflow = createAdminAccessWorkflow(baseUrl, password);

  console.log(`✅ 워크플로우 단계 수: ${workflow.length}개\n`);

  workflow.forEach((step, index) => {
    console.log(`[단계 ${step.step}] ${step.description}`);
    console.log(`  툴: ${step.tool}`);
    console.log(`  파라미터 키: ${Object.keys(step.parameters).join(', ')}`);
    console.log(`  예상 결과: ${step.expectedResult}`);
    console.log('');

    // 필수 파라미터 확인
    const tools = getBrowserMCPTools();
    const tool = tools.find((t) => t.name === step.tool);
    if (tool) {
      const requiredParams = tool.parameters.filter((p) => p.required);
      if (requiredParams.length > 0) {
        console.log(`  ⚠️  필수 파라미터: ${requiredParams.map((p) => p.name).join(', ')}`);
        console.log('');
      }
    }
  });

  return workflow.length > 0;
}

/**
 * 에러 분석 로직 테스트
 */
function testErrorAnalysis() {
  console.log('\n=== 에러 분석 로직 테스트 ===\n');

  // 테스트용 콘솔 메시지
  const testConsoleMessages = [
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
    {
      level: 'error',
      text: 'ERR_BLOCKED_BY_CLIENT',
      type: 'error',
    },
  ];

  console.log('테스트 콘솔 메시지:');
  console.log(JSON.stringify(testConsoleMessages, null, 2));
  console.log('');

  // 기본 에러 분석
  console.log('1. 기본 에러 분석:');
  const basicAnalysis = analyzeConsoleErrors(testConsoleMessages);
  console.log(`   - 총 에러: ${basicAnalysis.analysis.totalErrors}개`);
  console.log(`   - 총 경고: ${basicAnalysis.analysis.totalWarnings}개`);
  console.log(`   - 에러 유형 수: ${basicAnalysis.analysis.errorTypes.size}개`);
  console.log(`   - 해결 방안 수: ${basicAnalysis.analysis.suggestedFixes.length}개`);
  console.log('');

  // 상세 에러 분석
  console.log('2. 상세 에러 분석:');
  const errors = basicAnalysis.errors;
  const warnings = basicAnalysis.warnings;
  const detailedReport = generateDetailedErrorReport(errors, warnings);
  console.log(`   - 심각한 에러: ${detailedReport.summary.criticalErrors}개`);
  console.log(`   - 높은 우선순위: ${detailedReport.summary.highPriorityErrors}개`);
  console.log(`   - 권장사항 수: ${detailedReport.recommendations.length}개`);
  console.log(`   - 다음 단계 수: ${detailedReport.nextSteps.length}개`);
  console.log('');

  // 에러 리포트 생성
  console.log('3. 에러 리포트 생성:');
  const report = generateErrorReport(testConsoleMessages);
  console.log(`   - 타임스탬프: ${report.timestamp}`);
  console.log(`   - 총 에러: ${report.summary.totalErrors}개`);
  console.log(`   - 총 경고: ${report.summary.totalWarnings}개`);
  console.log(`   - 네트워크 에러: ${report.summary.totalNetworkErrors}개`);
  console.log(`   - 권장사항 수: ${report.recommendations.length}개`);
  console.log('');

  return true;
}

/**
 * 통합 테스트
 */
function runIntegrationTest() {
  console.log('\n=== 통합 테스트 ===\n');

  const tests = [
    { name: 'Browser MCP 툴 확인', test: testBrowserMCPTools },
    { name: '워크플로우 단계 검증', test: testWorkflowSteps },
    { name: '에러 분석 로직 테스트', test: testErrorAnalysis },
  ];

  const results: Array<{ name: string; passed: boolean }> = [];

  tests.forEach(({ name, test }) => {
    try {
      const passed = test();
      results.push({ name, passed });
      console.log(`✅ ${name}: ${passed ? '통과' : '실패'}\n`);
    } catch (error) {
      results.push({ name, passed: false });
      console.log(`❌ ${name}: 실패 - ${error}\n`);
    }
  });

  return results;
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  log.info('Browser MCP 사용 테스트 시작', { command });

  try {
    switch (command) {
      case 'tools':
      case 'tool': {
        const passed = testBrowserMCPTools();
        process.exit(passed ? 0 : 1);
        break;
      }

      case 'workflow':
      case 'steps': {
        const passed = testWorkflowSteps();
        process.exit(passed ? 0 : 1);
        break;
      }

      case 'analysis':
      case 'error': {
        const passed = testErrorAnalysis();
        process.exit(passed ? 0 : 1);
        break;
      }

      case 'all':
      case 'integration': {
        const results = runIntegrationTest();

        console.log('\n' + '='.repeat(80));
        console.log('테스트 결과 요약');
        console.log('='.repeat(80) + '\n');

        results.forEach((result) => {
          const icon = result.passed ? '✅' : '❌';
          console.log(`${icon} ${result.name}: ${result.passed ? '통과' : '실패'}`);
        });

        const allPassed = results.every((r) => r.passed);
        console.log(`\n${allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패'}\n`);

        if (allPassed) {
          console.log('다음 단계:');
          console.log('1. AI 에이전트가 Browser MCP 툴을 직접 사용할 수 있습니다.');
          console.log('2. `npm run admin:ai-workflow` 명령어로 워크플로우 가이드를 확인하세요.');
          console.log('3. `docs/AI_AGENT_BROWSER_MCP_GUIDE.md` 문서를 참고하세요.\n');
        }

        process.exit(allPassed ? 0 : 1);
        break;
      }

      case 'help':
      default: {
        console.log(`
Browser MCP 사용 테스트 스크립트

사용법:
  npm run admin:test-browser-mcp [command]

명령어:
  all, integration    모든 테스트 실행 (기본값)
  tools, tool         Browser MCP 툴 확인
  workflow, steps     워크플로우 단계 검증
  analysis, error     에러 분석 로직 테스트
  help                이 도움말 표시

예제:
  npm run admin:test-browser-mcp
  npm run admin:test-browser-mcp tools
  npm run admin:test-browser-mcp workflow
  npm run admin:test-browser-mcp analysis
        `);
        process.exit(0);
      }
    }
  } catch (error) {
    log.error('테스트 실행 중 오류 발생', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}




