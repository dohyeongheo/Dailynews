import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

async function testGeminiAPI() {
  console.log('🔍 Google Gemini API 연결 테스트 시작...\n');

  // 1. API 키 확인
  if (!API_KEY) {
    console.error('❌ 오류: GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.');
    console.log('💡 .env.local 파일에 GOOGLE_GEMINI_API_KEY를 설정해주세요.');
    process.exit(1);
  }

  if (API_KEY === 'your_google_gemini_api_key') {
    console.error('❌ 오류: API 키가 기본값입니다. 실제 API 키로 변경해주세요.');
    process.exit(1);
  }

  console.log('✅ API 키 확인 완료');
  console.log(`📝 API 키 (처음 10자): ${API_KEY.substring(0, 10)}...\n`);

  // 2. Gemini API 클라이언트 초기화 및 테스트
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // 사용 가능한 모델 목록 확인
    console.log('📋 사용 가능한 모델 확인 중...');
    const models = ['gemini-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];

    let model = null;
    let modelName = '';

    for (const modelNameToTry of models) {
      try {
        model = genAI.getGenerativeModel({ model: modelNameToTry });
        modelName = modelNameToTry;
        console.log(`✅ 모델 찾음: ${modelNameToTry}\n`);
        break;
      } catch (err) {
        console.log(`⚠️  ${modelNameToTry} 사용 불가, 다음 모델 시도...`);
        continue;
      }
    }

    if (!model) {
      // 기본 모델 시도
      model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      modelName = 'gemini-pro';
      console.log('✅ 기본 모델 사용: gemini-pro\n');
    }

    // 3. 간단한 테스트 요청
    console.log('📤 테스트 요청 전송 중...');
    const prompt = '안녕하세요. 간단히 "테스트 성공"이라고만 답변해주세요.';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ API 응답 수신 성공!\n');
    console.log('📥 응답 내용:');
    console.log(text);
    console.log(`\n🎉 Google Gemini API 연결 테스트 성공! (모델: ${modelName})`);

  } catch (error) {
    console.error('\n❌ API 연결 실패:');
    if (error instanceof Error) {
      console.error(`오류 메시지: ${error.message}`);

      if (error.message.includes('API_KEY')) {
        console.error('\n💡 API 키가 유효하지 않습니다. Google AI Studio에서 올바른 API 키를 확인해주세요.');
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        console.error('\n💡 API 할당량이 초과되었습니다. Google Cloud Console에서 할당량을 확인해주세요.');
      } else if (error.message.includes('permission')) {
        console.error('\n💡 API 권한이 없습니다. API 키에 Gemini API 접근 권한이 있는지 확인해주세요.');
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        console.error('\n💡 모델을 찾을 수 없습니다. API 키가 최신 Gemini API를 지원하는지 확인해주세요.');
        console.error('💡 Google AI Studio (https://makersuite.google.com/app/apikey)에서 새로운 API 키를 발급받아보세요.');
      }
    } else {
      console.error('알 수 없는 오류:', error);
    }
    process.exit(1);
  }
}

// 테스트 실행
testGeminiAPI().catch((error) => {
  console.error('예상치 못한 오류:', error);
  process.exit(1);
});
