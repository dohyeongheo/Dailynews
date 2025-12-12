import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

async function test() {
  console.log('🧪 최종 API 연결 테스트\n');

  if (!API_KEY) {
    console.error('❌ API 키가 설정되지 않았습니다.');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    console.log('📤 테스트 요청 전송 중...');
    const result = await model.generateContent('안녕하세요. 간단히 "테스트 성공"이라고만 답변해주세요.');
    const response = await result.response;
    const text = response.text();

    console.log('✅ API 연결 성공!');
    console.log(`📥 응답: ${text}\n`);
    console.log('🎉 Google Gemini API가 정상적으로 작동합니다!');

  } catch (error) {
    console.error('❌ 오류:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

test();

