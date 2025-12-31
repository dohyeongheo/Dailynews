#!/usr/bin/env tsx

/**
 * Sentry 에러 분석 CLI 스크립트
 * AI 에이전트가 실행할 수 있는 명령어
 */

import { isSentryEnabled, getSentryProjectUrl } from '../../lib/utils/sentry-helper';

const command = process.argv[2];
const arg = process.argv[3];

interface ErrorAnalysisResult {
  period: string;
  totalErrors: number;
  errorTypes: Record<string, number>;
  topErrors: Array<{
    issueId: string;
    title: string;
    count: number;
    lastSeen: string;
    level: string;
  }>;
  recommendations: string[];
}

async function main() {
  try {
    if (!isSentryEnabled()) {
      console.error('❌ Sentry가 설정되지 않았습니다.');
      console.log('환경 변수 NEXT_PUBLIC_SENTRY_DSN 또는 SENTRY_DSN을 확인해주세요.');
      process.exit(1);
    }

    switch (command) {
      case 'analyze':
        await handleAnalyze(arg ? Number(arg) : 7);
        break;
      case 'issues':
        await handleIssues(arg);
        break;
      case 'stats':
        await handleStats(arg ? Number(arg) : 7);
        break;
      default:
        console.log('사용 가능한 명령어:');
        console.log('  analyze [days]  - 최근 N일간 에러 분석 (기본값: 7일)');
        console.log('  issues [query]  - 이슈 검색 (자연어 쿼리)');
        console.log('  stats [days]    - 에러 통계 (기본값: 7일)');
        console.log('\n예시:');
        console.log('  npm run sentry:analyze analyze 7');
        console.log('  npm run sentry:analyze issues "최근 발생한 에러"');
        console.log('  npm run sentry:analyze stats 30');
        break;
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * 에러 분석 실행
 */
async function handleAnalyze(days: number) {
  console.log(`📊 최근 ${days}일간 Sentry 에러 분석 중...\n`);

  const projectUrl = getSentryProjectUrl();
  if (projectUrl) {
    console.log(`🔗 Sentry 프로젝트: ${projectUrl}\n`);
  }

  // TODO: Sentry MCP 서버를 통해 실제 이슈 조회
  // 현재는 구조만 제공하고, 실제 구현은 MCP 서버 호출로 대체 필요
  // 예시:
  // const issues = await mcp_Sentry_search_issues({
  //   organizationSlug: 'personal-4vx',
  //   projectSlug: 'daily-news',
  //   naturalLanguageQuery: `최근 ${days}일간 발생한 에러`,
  //   limit: 50,
  // });

  const analysis: ErrorAnalysisResult = {
    period: `${days}일`,
    totalErrors: 0,
    errorTypes: {},
    topErrors: [],
    recommendations: [],
  };

  // 분석 결과 출력
  console.log('📈 분석 결과:');
  console.log(`  기간: 최근 ${analysis.period}`);
  console.log(`  총 에러 수: ${analysis.totalErrors}`);
  console.log(`  에러 타입 수: ${Object.keys(analysis.errorTypes).length}\n`);

  if (analysis.topErrors.length > 0) {
    console.log('🔴 주요 에러:');
    analysis.topErrors.slice(0, 10).forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.title}`);
      console.log(`     발생 횟수: ${error.count}회`);
      console.log(`     마지막 발생: ${new Date(error.lastSeen).toLocaleString('ko-KR')}`);
      console.log(`     레벨: ${error.level}`);
      console.log('');
    });
  }

  if (analysis.recommendations.length > 0) {
    console.log('💡 권장 사항:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log('');
  }

  console.log('✅ 분석 완료');
}

/**
 * 이슈 검색
 */
async function handleIssues(query?: string) {
  const searchQuery = query || '최근 발생한 에러';
  console.log(`🔍 Sentry 이슈 검색: "${searchQuery}"\n`);

  // TODO: Sentry MCP 서버를 통해 실제 이슈 검색
  // 예시:
  // const issues = await mcp_Sentry_search_issues({
  //   organizationSlug: 'personal-4vx',
  //   projectSlug: 'daily-news',
  //   naturalLanguageQuery: searchQuery,
  //   limit: 20,
  // });

  console.log('⚠️  이 기능은 Sentry MCP 서버를 통해 구현되어야 합니다.');
  console.log('AI 에이전트에게 다음 명령어를 요청하세요:');
  console.log(`  "Sentry에서 '${searchQuery}' 이슈를 검색해줘"`);
}

/**
 * 에러 통계
 */
async function handleStats(days: number) {
  console.log(`📊 최근 ${days}일간 Sentry 에러 통계\n`);

  // TODO: Sentry MCP 서버를 통해 실제 통계 조회
  // 예시:
  // const events = await mcp_Sentry_search_events({
  //   organizationSlug: 'personal-4vx',
  //   projectSlug: 'daily-news',
  //   naturalLanguageQuery: `최근 ${days}일간 발생한 에러 통계`,
  //   limit: 100,
  // });

  console.log('⚠️  이 기능은 Sentry MCP 서버를 통해 구현되어야 합니다.');
  console.log('AI 에이전트에게 다음 명령어를 요청하세요:');
  console.log(`  "Sentry에서 최근 ${days}일간 에러 통계를 보여줘"`);
}

main();


