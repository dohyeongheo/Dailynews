import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

async function listAvailableModels() {
  console.log('📋 사용 가능한 모델 목록 조회\n');
  console.log('='.repeat(50));

  if (!API_KEY || API_KEY === 'your_google_gemini_api_key') {
    console.error('❌ 오류: API 키가 설정되지 않았습니다.');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ListModels API 직접 호출
    console.log('🔄 사용 가능한 모델 목록 조회 중...\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API 호출 실패: ${response.status} ${response.statusText}`);
      console.error(`응답: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();

    if (data.models && Array.isArray(data.models)) {
      console.log(`✅ 총 ${data.models.length}개의 모델 발견\n`);
      console.log('사용 가능한 모델 목록:');
      console.log('-'.repeat(50));

      const generateContentModels = data.models
        .filter((model: any) =>
          model.supportedGenerationMethods &&
          model.supportedGenerationMethods.includes('generateContent')
        )
        .map((model: any) => ({
          name: model.name,
          displayName: model.displayName,
          description: model.description,
        }));

      if (generateContentModels.length > 0) {
        console.log(`\n✅ generateContent를 지원하는 모델 (${generateContentModels.length}개):\n`);
        generateContentModels.forEach((model: any, index: number) => {
          console.log(`${index + 1}. ${model.name}`);
          if (model.displayName) console.log(`   표시명: ${model.displayName}`);
          if (model.description) console.log(`   설명: ${model.description}`);
          console.log('');
        });

        // 첫 번째 모델로 테스트
        const firstModel = generateContentModels[0];
        const modelName = firstModel.name.replace('models/', '');
        console.log(`\n🧪 첫 번째 모델로 테스트: ${modelName}`);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('안녕하세요');
        const response = await result.response;
        const text = response.text();

        console.log(`✅ 테스트 성공!`);
        console.log(`응답: ${text.substring(0, 100)}...\n`);

      } else {
        console.log('❌ generateContent를 지원하는 모델을 찾을 수 없습니다.');
      }
    } else {
      console.error('❌ 모델 목록을 가져올 수 없습니다.');
      console.error('응답 데이터:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    if (error instanceof Error) {
      console.error('메시지:', error.message);
      console.error('스택:', error.stack);
    }
    process.exit(1);
  }
}

listAvailableModels();

