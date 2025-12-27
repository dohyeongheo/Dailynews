/**
 * 이미지 생성 및 업로드 테스트 스크립트
 */
import * as dotenv from "dotenv";
import { generateImagePrompt } from "../lib/image-generator/prompt-generator";
import { generateAIImage } from "../lib/image-generator/ai-image-generator";
import { uploadNewsImage } from "../lib/storage/image-storage";
import type { NewsInput } from "../types/news";

// 환경 변수 로드
dotenv.config({ path: ".env.local" });
dotenv.config();

async function testImageGeneration() {
  console.log("=== 이미지 생성 및 업로드 테스트 ===\n");

  // 환경 변수 확인
  const imageGenerationApi = process.env.IMAGE_GENERATION_API || "none";
  console.log("1. 환경 변수 확인:");
  console.log(`   IMAGE_GENERATION_API: ${imageGenerationApi}`);
  console.log(`   GOOGLE_GEMINI_API_KEY: ${process.env.GOOGLE_GEMINI_API_KEY ? "✅ 설정됨" : "❌ 설정되지 않음"}`);
  console.log(`   REPLICATE_API_TOKEN: ${process.env.REPLICATE_API_TOKEN ? "✅ 설정됨" : "❌ 설정되지 않음"}`);
  console.log(`   HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? "✅ 설정됨" : "❌ 설정되지 않음"}`);
  console.log(`   DEEPAI_API_KEY: ${process.env.DEEPAI_API_KEY ? "✅ 설정됨" : "❌ 설정되지 않음"}`);
  console.log(`   BLOB_READ_WRITE_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN ? "✅ 설정됨" : "❌ 설정되지 않음"}`);

  if (imageGenerationApi === "none") {
    console.error("\n❌ IMAGE_GENERATION_API가 'none'으로 설정되어 있습니다.");
    console.log("   환경 변수에서 IMAGE_GENERATION_API를 'gemini', 'replicate', 'huggingface', 또는 'deepai'로 설정하세요.");
    process.exit(1);
  }

  if (imageGenerationApi === "gemini" && !process.env.GOOGLE_GEMINI_API_KEY) {
    console.error("\n❌ IMAGE_GENERATION_API가 'gemini'로 설정되었지만 GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.");
    process.exit(1);
  }

  // 테스트 뉴스 데이터
  const testNews: NewsInput = {
    published_date: new Date().toISOString().split("T")[0],
    source_country: "한국",
    source_media: "테스트 미디어",
    title: "태국 관광 산업 회복세 지속, 한국인 방문객 증가",
    content: "태국 관광 산업이 코로나19 이후 지속적인 회복세를 보이고 있으며, 특히 한국인 방문객이 크게 증가하고 있다. 태국 관광청에 따르면 올해 상반기 한국인 관광객 수가 전년 대비 150% 증가했다고 발표했다.",
    content_translated: null,
    category: "태국뉴스",
    news_category: "경제",
    original_link: "https://example.com/test-news",
  };

  try {
    // 1. 프롬프트 생성
    console.log("\n2. 이미지 프롬프트 생성:");
    console.log(`   뉴스 제목: ${testNews.title}`);
    const prompt = await generateImagePrompt(testNews);
    console.log(`   ✅ 프롬프트 생성 완료`);
    console.log(`   프롬프트: ${prompt.substring(0, 100)}...`);

    // 2. AI 이미지 생성
    console.log("\n3. AI 이미지 생성:");
    console.log(`   API: ${imageGenerationApi}`);
    const imageBuffer = await generateAIImage(prompt);
    console.log(`   ✅ 이미지 생성 완료`);
    console.log(`   이미지 크기: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // 3. Vercel Blob에 업로드
    console.log("\n4. Vercel Blob Storage 업로드:");
    const testNewsId = `test-${Date.now()}`;
    const imageUrl = await uploadNewsImage(testNewsId, imageBuffer);
    console.log(`   ✅ 업로드 완료`);
    console.log(`   이미지 URL: ${imageUrl}`);

    console.log("\n✅ 이미지 생성 및 업로드 테스트 성공!");
    console.log(`\n생성된 이미지 확인: ${imageUrl}`);
    return true;
  } catch (error) {
    console.error("\n❌ 이미지 생성 및 업로드 테스트 실패:");
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
testImageGeneration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("예상치 못한 오류:", error);
    process.exit(1);
  });

