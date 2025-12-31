#!/usr/bin/env node
/**
 * 현재 콘솔 에러 분석 스크립트
 */

import { analyzeConsoleErrors, generateErrorReport } from '@/lib/utils/browser-mcp-direct';
import { generateDetailedErrorReport } from '@/lib/utils/error-analyzer';

const consoleMessages = [
  {
    level: 'error',
    text: 'Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3000/api/analytics/session:0',
    type: 'error',
  },
  {
    level: 'warning',
    text: '[WARN] 세션 등록 실패 (계속 진행)',
    type: 'warning',
  },
  {
    level: 'error',
    text: 'Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3000/api/analytics/pageview:0',
    type: 'error',
  },
  {
    level: 'error',
    text: '[ERROR] 페이지뷰 추적 실패',
    type: 'error',
  },
];

const networkRequests = [
  { url: 'http://localhost:3000/api/analytics/session', method: 'POST', status: 404 },
  { url: 'http://localhost:3000/api/analytics/pageview', method: 'POST', status: 404 },
];

const basicAnalysis = analyzeConsoleErrors(consoleMessages);
const errors = basicAnalysis.errors;
const warnings = basicAnalysis.warnings;
const detailedReport = generateDetailedErrorReport(errors, warnings);
const fullReport = generateErrorReport(consoleMessages, networkRequests);

console.log('=== 에러 분석 리포트 ===\n');
console.log('요약:');
console.log(`  - 총 에러: ${detailedReport.summary.totalErrors}개`);
console.log(`  - 총 경고: ${detailedReport.summary.totalWarnings}개`);
console.log(`  - 심각한 에러: ${detailedReport.summary.criticalErrors}개`);
console.log(`  - 높은 우선순위: ${detailedReport.summary.highPriorityErrors}개\n`);

console.log('에러 상세:');
detailedReport.errorAnalyses.forEach((analysis, index) => {
  console.log(`\n${index + 1}. ${analysis.error.message.substring(0, 80)}...`);
  console.log(`   심각도: ${analysis.severity}`);
  console.log(`   카테고리: ${analysis.primaryPattern?.category || '알 수 없음'}`);
  console.log(`   해결 방안: ${analysis.solution}`);
  if (analysis.suggestedFiles.length > 0) {
    console.log(`   관련 파일: ${analysis.suggestedFiles.slice(0, 3).join(', ')}`);
  }
});

console.log('\n권장사항:');
detailedReport.recommendations.forEach((rec, index) => {
  console.log(`  ${index + 1}. ${rec}`);
});

console.log('\n다음 단계:');
detailedReport.nextSteps.forEach((step) => {
  console.log(`  ${step}`);
});

console.log('\n네트워크 에러:');
fullReport.networkErrors.forEach((error, index) => {
  console.log(`  ${index + 1}. ${error.method} ${error.url} => ${error.status}`);
});

