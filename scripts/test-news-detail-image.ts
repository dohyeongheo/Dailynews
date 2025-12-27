/**
 * 뉴스 상세 페이지 이미지 출력 기능 테스트 스크립트
 */
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// 환경 변수 로드
dotenv.config({ path: ".env.local" });
dotenv.config();

// Supabase 클라이언트 직접 생성 (환경 변수 검증 우회)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testNewsDetailImage() {
  console.log("=== 뉴스 상세 페이지 이미지 출력 기능 테스트 ===\n");

  try {
    // 1. image_url이 있는 뉴스 조회
    console.log("1. image_url이 있는 뉴스 조회:");
    const { data: newsWithImages, error: fetchError } = await supabaseServer
      .from("news")
      .select("id, title, image_url")
      .not("image_url", "is", null)
      .limit(5);

    if (fetchError) {
      console.error("❌ 뉴스 조회 실패:", fetchError.message);
      return false;
    }

    if (!newsWithImages || newsWithImages.length === 0) {
      console.log("⚠️  image_url이 있는 뉴스가 없습니다.");
      console.log("   먼저 이미지 생성 테스트를 실행하여 이미지가 있는 뉴스를 생성하세요.");
      return false;
    }

    console.log(`   ✅ ${newsWithImages.length}개의 이미지가 있는 뉴스 발견\n`);

    // 2. 각 뉴스의 상세 정보 확인
    console.log("2. 뉴스 상세 정보 확인:");
    for (const news of newsWithImages) {
      console.log(`\n   📰 뉴스 ID: ${news.id}`);
      console.log(`   제목: ${news.title?.substring(0, 50)}...`);
      console.log(`   이미지 URL: ${news.image_url}`);

      // 직접 조회하여 전체 정보 확인
      const { data: fullNewsData, error: fullNewsError } = await supabaseServer
        .from("news")
        .select("*")
        .eq("id", news.id)
        .single();

      const fullNews = fullNewsData;
      if (fullNews) {
        console.log(`   ✅ getNewsById 성공`);
        console.log(`   image_url 필드: ${fullNews.image_url ? "✅ 있음" : "❌ 없음"}`);

        if (fullNews.image_url) {
          // 이미지 URL 유효성 검사
          try {
            const url = new URL(fullNews.image_url);
            console.log(`   이미지 URL 형식: ✅ 유효 (${url.hostname})`);

            // 이미지 접근 가능 여부 확인 (HEAD 요청)
            try {
              const imageResponse = await fetch(fullNews.image_url, { method: "HEAD" });
              if (imageResponse.ok) {
                console.log(`   이미지 접근: ✅ 가능 (${imageResponse.status})`);
                const contentType = imageResponse.headers.get("content-type");
                if (contentType) {
                  console.log(`   이미지 타입: ${contentType}`);
                }
              } else {
                console.log(`   이미지 접근: ❌ 실패 (${imageResponse.status})`);
              }
            } catch (fetchError) {
              console.log(`   이미지 접근: ⚠️  확인 불가 (${fetchError instanceof Error ? fetchError.message : String(fetchError)})`);
            }
          } catch {
            console.log(`   이미지 URL 형식: ❌ 유효하지 않음`);
          }
        }
      } else {
        console.log(`   ❌ getNewsById 실패`);
      }
    }

    console.log("\n✅ 뉴스 상세 페이지 이미지 출력 기능 테스트 완료!");
    console.log(`\n테스트할 뉴스 URL 예시:`);
    console.log(`   http://localhost:3000/news/${newsWithImages[0].id}`);

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
testNewsDetailImage()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("예상치 못한 오류:", error);
    process.exit(1);
  });

