/**
 * 수동 뉴스 수집 스크립트
 * 
 * 사용법: node scripts/fetch-news-manual.mjs
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// .env 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Next.js 환경 변수 설정
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Server Action 직접 호출 (동적 import 사용)
async function main() {
  console.log('🔄 뉴스 수집을 시작합니다...\n');

  try {
    // Next.js 앱의 Server Action을 직접 호출
    const { fetchAndSaveNewsAction } = await import('../lib/actions.js');
    
    const result = await fetchAndSaveNewsAction();

    if (result.success) {
      console.log('✅ 뉴스 수집 성공!');
      console.log(`📊 ${result.message}`);
      if (result.data) {
        console.log(`   - 총 뉴스: ${result.data.total || 0}개`);
        console.log(`   - 성공: ${result.data.success || 0}개`);
        console.log(`   - 실패: ${result.data.failed || 0}개`);
      }
      process.exit(0);
    } else {
      console.error('❌ 뉴스 수집 실패:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    if (error instanceof Error) {
      console.error('   스택:', error.stack);
    }
    process.exit(1);
  }
}

main();

