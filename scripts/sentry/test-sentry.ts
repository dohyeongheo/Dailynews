#!/usr/bin/env tsx

/**
 * Sentry 설정 테스트 스크립트
 * Sentry가 정상적으로 작동하는지 확인
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 환경 변수 로드
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { isSentryEnabled, captureErrorWithContext, addSentryBreadcrumb } from '../../lib/utils/sentry-helper';
import * as Sentry from '@sentry/nextjs';

async function testSentry() {
  console.log('🔍 Sentry 설정 테스트 시작...\n');

  // 1. Sentry 활성화 확인
  console.log('1. Sentry 활성화 상태 확인');
  const enabled = isSentryEnabled();
  console.log(`   ${enabled ? '✅' : '❌'} Sentry 활성화: ${enabled ? '활성화됨' : '비활성화됨'}`);

  if (!enabled) {
    console.log('\n⚠️  Sentry가 비활성화되어 있습니다.');
    console.log('   환경 변수 NEXT_PUBLIC_SENTRY_DSN 또는 SENTRY_DSN을 확인해주세요.');
    process.exit(1);
  }

  // 2. 환경 변수 확인
  console.log('\n2. 환경 변수 확인');
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;
  const release = process.env.NEXT_PUBLIC_SENTRY_RELEASE;

  console.log(`   ${dsn ? '✅' : '❌'} DSN: ${dsn ? '설정됨' : '미설정'}`);
  console.log(`   ${org ? '✅' : '⚠️ '} 조직: ${org || '미설정'}`);
  console.log(`   ${project ? '✅' : '⚠️ '} 프로젝트: ${project || '미설정'}`);
  console.log(`   ${release ? '✅' : '⚠️ '} 릴리스: ${release || '미설정'}`);

  // 3. 브레드크럼 테스트
  console.log('\n3. 브레드크럼 추가 테스트');
  try {
    addSentryBreadcrumb('테스트 브레드크럼', 'test', 'info', {
      testId: 'sentry-test-001',
      timestamp: new Date().toISOString(),
    });
    console.log('   ✅ 브레드크럼 추가 성공');
  } catch (error) {
    console.log(`   ❌ 브레드크럼 추가 실패: ${error instanceof Error ? error.message : error}`);
  }

  // 4. 테스트 에러 캡처
  console.log('\n4. 테스트 에러 캡처');
  try {
    const testError = new Error('Sentry 테스트 에러 - 이것은 테스트용 에러입니다');
    const eventId = captureErrorWithContext(testError, {
      tags: {
        test: 'true',
        source: 'sentry-test-script',
      },
      extra: {
        testId: 'sentry-test-001',
        timestamp: new Date().toISOString(),
      },
      level: 'warning',
    });

    if (eventId) {
      console.log(`   ✅ 에러 캡처 성공 (Event ID: ${eventId})`);
      console.log('   ℹ️  Sentry 대시보드에서 이 이벤트를 확인할 수 있습니다.');
    } else {
      console.log('   ⚠️  에러 캡처는 시도되었지만 Event ID를 받지 못했습니다.');
    }
  } catch (error) {
    console.log(`   ❌ 에러 캡처 실패: ${error instanceof Error ? error.message : error}`);
  }

  // 5. 메시지 캡처 테스트
  console.log('\n5. 메시지 캡처 테스트');
  try {
    const messageId = Sentry.captureMessage('Sentry 테스트 메시지', {
      level: 'info',
      tags: {
        test: 'true',
        source: 'sentry-test-script',
      },
    });

    if (messageId) {
      console.log(`   ✅ 메시지 캡처 성공 (Event ID: ${messageId})`);
    } else {
      console.log('   ⚠️  메시지 캡처는 시도되었지만 Event ID를 받지 못했습니다.');
    }
  } catch (error) {
    console.log(`   ❌ 메시지 캡처 실패: ${error instanceof Error ? error.message : error}`);
  }

  // 6. Sentry 초기화 확인
  console.log('\n6. Sentry 초기화 확인');
  try {
    // Sentry v7+에서는 getCurrentHub 대신 다른 방법 사용
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
    const env = process.env.NODE_ENV || 'development';

    if (dsn) {
      console.log('   ✅ Sentry 설정 확인됨');
      console.log(`   ℹ️  환경: ${env}`);
      console.log(`   ℹ️  DSN 설정됨: ${!!dsn}`);
      console.log(`   ℹ️  DSN 시작 부분: ${dsn.substring(0, 30)}...`);
    } else {
      console.log('   ⚠️  Sentry DSN이 설정되지 않았습니다.');
    }
  } catch (error) {
    console.log(`   ❌ Sentry 초기화 확인 실패: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n✅ Sentry 설정 테스트 완료!');
  console.log('\n📝 다음 단계:');
  console.log('   1. Sentry 대시보드(https://personal-4vx.sentry.io)에서 테스트 이벤트 확인');
  console.log('   2. 프로젝트 설정에서 DSN이 올바르게 설정되었는지 확인');
  console.log('   3. 실제 애플리케이션에서 에러가 발생하면 자동으로 캡처되는지 확인');
}

testSentry().catch((error) => {
  console.error('❌ 테스트 실행 중 오류 발생:', error);
  process.exit(1);
});

