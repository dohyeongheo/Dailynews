import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

async function testGeminiAPI() {
  console.log('🔍 Google Gemini API 연결 테스트 시작...\n');

  if (!API_KEY || API_KEY === 'your_google_gemini_api_key') {
    console.error('❌ 오류: API 키가 설정되지 않았거나 기본값입니다.');
    process.exit(1);
  }

  console.log('✅ API 키 확인 완료\n');

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // 사용 가능한 모델 목록 가져오기 시도
    console.log('📋 사용 가능한 모델 확인 중...\n');

    // 여러 모델 이름 시도
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
    ];

    let success = false;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 ${modelName} 시도 중...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent('테스트');
        const response = await result.response;
        const text = response.text();

        console.log(`✅ 성공! 모델: ${modelName}`);
        console.log(`📥 응답: ${text.substring(0, 50)}...\n`);
        success = true;
        break;
      } catch (err: any) {
        if (err.message && err.message.includes('404')) {
          console.log(`❌ ${modelName}: 모델을 찾을 수 없음\n`);
        } else {
          console.log(`❌ ${modelName}: ${err.message}\n`);
        }
        continue;
      }
    }

    if (!success) {
      console.error('❌ 모든 모델 시도 실패');
      console.error('\n💡 가능한 원인:');
      console.error('1. API 키가 유효하지 않거나 만료되었습니다.');
      console.error('2. API 키에 Gemini API 접근 권한이 없습니다.');
      console.error('3. Google Cloud Console에서 API가 활성화되지 않았습니다.');
      console.error('\n💡 해결 방법:');
      console.error('1. Google AI Studio (https://makersuite.google.com/app/apikey)에서 새 API 키 발급');
      console.error('2. Google Cloud Console에서 "Generative Language API" 활성화 확인');
      process.exit(1);
    }

    console.log('🎉 Google Gemini API 연결 테스트 성공!');

  } catch (error) {
    console.error('\n❌ 예상치 못한 오류:', error);
    process.exit(1);
  }
}

testGeminiAPI();

