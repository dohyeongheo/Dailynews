/**
 * Bundle 크기 분석 스크립트
 * next build 후 .next/analyze 폴더에 결과 생성
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Bundle 분석 시작...');

try {
  // @next/bundle-analyzer를 사용하여 분석
  execSync('ANALYZE=true npm run build', { stdio: 'inherit' });

  console.log('✅ Bundle 분석 완료!');
  console.log('📊 결과는 .next/analyze 폴더에서 확인할 수 있습니다.');
} catch (error) {
  console.error('❌ Bundle 분석 실패:', error);
  process.exit(1);
}

