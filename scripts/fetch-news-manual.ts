/**
 * 수동 뉴스 수집 스크립트
 * 
 * 사용법: npx tsx scripts/fetch-news-manual.ts
 * 
 * 주의: 이 스크립트는 개발 서버가 실행 중일 때 API 엔드포인트를 호출합니다.
 * 또는 브라우저에서 http://localhost:3000/api/cron/test 를 직접 접근할 수 있습니다.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// .env.local 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '..', '.env.local') });

import { fetchAndSaveNewsAction } from '../lib/actions';

async function main() {
  console.log('🔄 뉴스 수집을 시작합니다...\n');

  try {
    const result = await fetchAndSaveNewsAction();

    if (result.success) {
      console.log('✅ 뉴스 수집 성공!');
      console.log(`📊 ${result.message}`);
      if (result.data) {
        console.log(`   - 총 뉴스: ${result.data.total || 0}개`);
        console.log(`   - 성공: ${result.data.success || 0}개`);
        console.log(`   - 실패: ${result.data.failed || 0}개`);
      }
    } else {
      console.error('❌ 뉴스 수집 실패:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();

