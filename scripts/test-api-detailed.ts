import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

async function testGeminiAPI() {
  console.log('🔍 Google Gemini API 상세 연결 테스트\n');
  console.log('='.repeat(50));

  if (!API_KEY || API_KEY === 'your_google_gemini_api_key') {
    console.error('❌ 오류: API 키가 설정되지 않았거나 기본값입니다.');
    process.exit(1);
  }

  console.log(`✅ API 키 확인 완료`);
  console.log(`📝 API 키 길이: ${API_KEY.length}자`);
  console.log(`📝 API 키 시작: ${API_KEY.substring(0, 15)}...`);
  console.log(`📝 API 키 형식: ${API_KEY.startsWith('AIza') ? '올바른 형식 (AIza로 시작)' : '의심스러운 형식'}\n`);

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    console.log('✅ GoogleGenerativeAI 클라이언트 생성 완료\n');

    // 직접 API 엔드포인트 테스트
    console.log('📡 API 엔드포인트 직접 테스트...\n');

    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    console.log(`테스트 URL (일부): ${testUrl.substring(0, 80)}...\n`);

    // 여러 모델 시도
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`\n🔄 ${modelName} 테스트 중...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log(`  - 모델 객체 생성: ✅`);

        const result = await model.generateContent('Hello');
        const response = await result.response;
        const text = response.text();

        console.log(`  - API 응답 수신: ✅`);
        console.log(`  - 응답 내용: ${text.substring(0, 50)}...`);
        console.log(`\n🎉 ${modelName} 모델 작동 확인!`);
        return;

      } catch (err: any) {
        console.log(`  - 오류 발생: ❌`);
        console.log(`  - 오류 타입: ${err.constructor.name}`);
        console.log(`  - 오류 메시지: ${err.message}`);

        if (err.response) {
          console.log(`  - HTTP 상태: ${err.response.status}`);
          console.log(`  - 응답 데이터: ${JSON.stringify(err.response.data).substring(0, 200)}`);
        }

        if (err.cause) {
          console.log(`  - 원인: ${err.cause}`);
        }

        continue;
      }
    }

    console.error('\n❌ 모든 모델 테스트 실패');
    console.error('\n💡 추가 확인 사항:');
    console.error('1. Google AI Studio에서 API 키가 활성화되어 있는지 확인');
    console.error('2. API 키에 제한사항(IP, HTTP referrer 등)이 있는지 확인');
    console.error('3. Google Cloud Console에서 "Generative Language API" 활성화 확인');
    console.error('4. API 키가 만료되지 않았는지 확인');

    process.exit(1);

  } catch (error) {
    console.error('\n❌ 예상치 못한 오류:', error);
    if (error instanceof Error) {
      console.error('스택 트레이스:', error.stack);
    }
    process.exit(1);
  }
}

testGeminiAPI();

