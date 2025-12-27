/**
 * 이미지 프롬프트 생성 테스트 스크립트
 */
import * as dotenv from "dotenv";
import { generateImagePrompt } from "../lib/image-generator/prompt-generator";
import type { NewsInput } from "../types/news";

// 환경 변수 로드
dotenv.config({ path: ".env.local" });
dotenv.config();

async function testPromptGeneration() {
  console.log("=== 이미지 프롬프트 생성 테스트 ===\n");

  // 환경 변수 확인
  console.log("1. 환경 변수 확인:");
  console.log(`   GOOGLE_GEMINI_API_KEY: ${process.env.GOOGLE_GEMINI_API_KEY ? "✅ 설정됨" : "❌ 설정되지 않음"}`);

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error("\n❌ GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.");
    process.exit(1);
  }

  // 테스트 뉴스 데이터
  const testNews: NewsInput = {
    published_date: new Date().toISOString().split("T")[0],
    source_country: "한국",
    source_media: "테스트 미디어",
    title: "태국 관광 산업 회복세 지속, 한국인 방문객 증가",
    content: "태국 관광 산업이 코로나19 이후 지속적인 회복세를 보이고 있으며, 특히 한국인 방문객이 크게 증가하고 있다. 태국 관광청에 따르면 올해 상반기 한국인 관광객 수가 전년 대비 150% 증가했다고 발표했다. 방콕, 푸켓, 치앙마이 등 주요 관광지에서 한국인 관광객의 증가세가 두드러지고 있으며, 태국 정부는 한국 시장에 대한 마케팅을 강화하고 있다.",
    content_translated: null,
    category: "태국뉴스",
    news_category: "경제",
    original_link: "https://example.com/test-news",
  };

  try {
    console.log("\n2. 테스트 뉴스 데이터:");
    console.log(`   제목: ${testNews.title}`);
    console.log(`   카테고리: ${testNews.category} > ${testNews.news_category}`);
    console.log(`   내용 길이: ${testNews.content.length}자`);

    // 프롬프트 생성
    console.log("\n3. 이미지 프롬프트 생성:");
    console.log("   Gemini API 호출 중...");
    const prompt = await generateImagePrompt(testNews);
    console.log(`   ✅ 프롬프트 생성 완료`);
    console.log(`\n   생성된 프롬프트:`);
    console.log(`   ${prompt}`);
    console.log(`\n   프롬프트 길이: ${prompt.length}자`);

    console.log("\n✅ 이미지 프롬프트 생성 테스트 성공!");
    return true;
  } catch (error) {
    console.error("\n❌ 이미지 프롬프트 생성 테스트 실패:");
    if (error instanceof Error) {
      console.error(`   오류: ${error.message}`);
      if (error.stack) {
        console.error(`   스택: ${error.stack}`);
      }
    } else {
      console.error(`   오류: ${String(error)}`);
    }
    return false;
  }
}

// 스크립트 실행
testPromptGeneration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("예상치 못한 오류:", error);
    process.exit(1);
  });

