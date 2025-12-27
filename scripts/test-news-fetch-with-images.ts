/**
 * 뉴스 수집 및 이미지 생성 통합 테스트 스크립트
 * 5개의 뉴스만 수집하여 테스트
 */
import * as dotenv from "dotenv";
// 환경 변수가 없어도 테스트할 수 있도록 필요한 함수만 직접 import
import { generateImagePrompt } from "../lib/image-generator/prompt-generator";
import { generateAIImage } from "../lib/image-generator/ai-image-generator";
import { uploadNewsImage } from "../lib/storage/image-storage";
// getEnv는 사용하지 않고 process.env 직접 사용

// 환경 변수 로드
dotenv.config({ path: ".env.local" });
dotenv.config();

async function testNewsFetchWithImages() {
  console.log("=== 뉴스 수집 및 이미지 생성 통합 테스트 ===\n");

  // 환경 변수 확인
  let imageGenerationApi = process.env.IMAGE_GENERATION_API || "none";
  console.log("1. 환경 변수 확인:");
  console.log(`   IMAGE_GENERATION_API: ${imageGenerationApi}`);
  console.log(`   GOOGLE_GEMINI_API_KEY: ${process.env.GOOGLE_GEMINI_API_KEY ? "✅ 설정됨" : "❌ 설정되지 않음"}`);
  console.log(`   BLOB_READ_WRITE_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN ? "✅ 설정됨" : "❌ 설정되지 않음"}`);

  // 테스트를 위해 이미지 생성 API가 'none'이면 'gemini'로 강제 설정
  if (imageGenerationApi === "none") {
    console.log("\n⚠️  IMAGE_GENERATION_API가 'none'으로 설정되어 있습니다.");
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      console.log("   테스트를 위해 'gemini'로 자동 설정합니다.");
      imageGenerationApi = "gemini";
      process.env.IMAGE_GENERATION_API = "gemini"; // 테스트 중에만 사용
    } else {
      console.error("   ❌ GOOGLE_GEMINI_API_KEY가 설정되지 않아 이미지 생성 테스트를 진행할 수 없습니다.");
      return false;
    }
  }

  if (imageGenerationApi === "gemini" && !process.env.GOOGLE_GEMINI_API_KEY) {
    console.error("\n❌ IMAGE_GENERATION_API가 'gemini'로 설정되었지만 GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.");
    return false;
  }

  try {
    // 2. 뉴스 수집 (5개만)
    console.log("\n2. 뉴스 수집 시작 (5개만):");
    console.log("   Gemini API에 요청 중...");

    // Gemini API에 직접 요청하여 5개만 수집
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const date = new Date().toISOString().split("T")[0];
    const prompt = `${date}의 태국 주요 뉴스(한국어 번역), 한국의 태국 관련 뉴스, 한국 주요 뉴스를 정확히 5개의 뉴스만 수집하여 JSON 포맷으로 출력해주세요.

다음 JSON 형식을 정확히 따라주세요:
{
  "news": [
    {
      "title": "뉴스 제목",
      "content": "뉴스 본문 내용",
      "content_translated": "번역된 내용 (태국 뉴스인 경우)",
      "source_country": "태국" 또는 "한국",
      "source_media": "언론사 이름",
      "category": "태국뉴스" 또는 "관련뉴스" 또는 "한국뉴스",
      "news_category": "과학" 또는 "사회" 또는 "정치" 또는 "경제" 또는 "스포츠" 또는 "문화" 또는 "기술" 또는 "건강" 또는 "환경" 또는 "국제" 또는 "기타" (뉴스 내용을 분석하여 가장 적합한 주제 분류를 선택, 없으면 null),
      "published_date": "${date}",
      "original_link": "뉴스 원문 URL (실제 뉴스 기사 링크, 없으면 빈 문자열)"
    }
  ]
}

중요 사항:
- 정확히 5개의 뉴스만 수집해주세요 (더 많거나 적으면 안 됩니다)
- 각 뉴스의 본문 내용(content)은 상세하게 작성해주세요. 최소 300자 이상으로 작성해주세요.
- news_category는 뉴스의 제목과 내용을 분석하여 가장 적합한 주제 분류를 선택해주세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 추출
    let jsonText = text.trim();
    if (jsonText.includes("```")) {
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1].trim();
      }
    }

    const startIndex = jsonText.indexOf("{");
    const endIndex = jsonText.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1) {
      jsonText = jsonText.substring(startIndex, endIndex + 1);
    }

    const parsedData = JSON.parse(jsonText);
    const newsItems = parsedData.news || [];

    console.log(`   ✅ ${newsItems.length}개의 뉴스 수집 완료`);

    if (newsItems.length === 0) {
      console.error("\n❌ 수집된 뉴스가 없습니다.");
      return false;
    }

    // 3. 뉴스 저장 (환경 변수가 없으면 스킵)
    let savedNewsIds: string[] = [];
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("\n3. 뉴스 데이터베이스 저장:");
      const { insertNewsBatch } = await import("../lib/db/news");
      const saveResult = await insertNewsBatch(newsItems);
      console.log(`   ✅ 저장 완료: 성공 ${saveResult.success}개, 실패 ${saveResult.failed}개`);

      if (saveResult.success === 0) {
        console.error("\n❌ 뉴스 저장에 실패했습니다.");
        return false;
      }

      savedNewsIds = saveResult.savedNewsIds || [];
    } else {
      console.log("\n3. 뉴스 데이터베이스 저장: 스킵됨 (환경 변수 미설정)");
      console.log("   테스트용으로 뉴스 데이터만 사용합니다.");
      // 테스트용으로 임시 ID 생성
      savedNewsIds = newsItems.map((_item: any, index: number) => `test-${Date.now()}-${index}`);
    }

    // 4. 이미지 생성 (저장된 뉴스에 대해)
    if (imageGenerationApi !== "none" && savedNewsIds.length > 0) {
      console.log("\n4. 이미지 생성 및 업로드:");
      console.log(`   ${savedNewsIds.length}개의 뉴스에 대해 이미지 생성 시작...`);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < savedNewsIds.length; i++) {
        const newsId = savedNewsIds[i];
        const newsItem = newsItems[i];

        try {
          let savedNews;

          // DB에 저장된 경우 조회, 아니면 원본 데이터 사용
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabaseNews = await import("../lib/db/supabase-news");
            savedNews = await supabaseNews.getNewsById(newsId);
            if (!savedNews) {
              console.log(`   ⚠️  뉴스 ID ${newsId}를 찾을 수 없습니다. 원본 데이터 사용.`);
              savedNews = null;
            }
          }

          const newsInput = savedNews ? {
            published_date: savedNews.published_date,
            source_country: savedNews.source_country,
            source_media: savedNews.source_media,
            title: savedNews.title,
            content: savedNews.content,
            content_translated: savedNews.content_translated || null,
            category: savedNews.category,
            news_category: savedNews.news_category || null,
            original_link: savedNews.original_link,
          } : {
            published_date: newsItem.published_date || new Date().toISOString().split("T")[0],
            source_country: newsItem.source_country,
            source_media: newsItem.source_media,
            title: newsItem.title,
            content: newsItem.content,
            content_translated: newsItem.content_translated || null,
            category: newsItem.category,
            news_category: newsItem.news_category || null,
            original_link: newsItem.original_link || "",
          };

          console.log(`   📰 뉴스: ${newsInput.title.substring(0, 50)}...`);

          // 프롬프트 생성
          const imagePrompt = await generateImagePrompt(newsInput);
          console.log(`      프롬프트 생성 완료`);

          // 이미지 생성
          const imageBuffer = await generateAIImage(imagePrompt);
          console.log(`      이미지 생성 완료 (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

          // Vercel Blob에 업로드
          const imageUrl = await uploadNewsImage(newsId, imageBuffer);
          console.log(`      업로드 완료: ${imageUrl}`);

          // DB에 image_url 업데이트 (환경 변수가 있는 경우만)
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { updateNewsImageUrl } = await import("../lib/db/news");
            await updateNewsImageUrl(newsId, imageUrl);
          }
          console.log(`      ✅ 완료\n`);

          successCount++;
        } catch (error) {
          console.error(`      ❌ 실패: ${error instanceof Error ? error.message : String(error)}\n`);
          failCount++;
        }
      }

      console.log(`\n   이미지 생성 결과: 성공 ${successCount}개, 실패 ${failCount}개`);
    } else {
      console.log("\n4. 이미지 생성: 스킵됨 (IMAGE_GENERATION_API가 'none'으로 설정됨)");
    }

    console.log("\n✅ 뉴스 수집 및 이미지 생성 테스트 완료!");
    return true;
  } catch (error) {
    console.error("\n❌ 테스트 실패:");
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
testNewsFetchWithImages()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("예상치 못한 오류:", error);
    process.exit(1);
  });

