/**
 * 간단한 이미지 생성 테스트 스크립트 (더미 이미지 사용)
 * 실제 API 키 없이 Vercel Blob 업로드만 테스트
 */
import * as dotenv from "dotenv";
import { uploadNewsImage } from "../lib/storage/image-storage";

// 환경 변수 로드
dotenv.config({ path: ".env.local" });
dotenv.config();

async function testImageUpload() {
  console.log("=== 간단한 이미지 업로드 테스트 ===\n");

  // 환경 변수 확인
  console.log("1. 환경 변수 확인:");
  console.log(`   BLOB_READ_WRITE_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN ? "✅ 설정됨" : "❌ 설정되지 않음"}`);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("\n❌ BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다.");
    console.log("   Vercel 대시보드에서 환경 변수를 확인하세요.");
    process.exit(1);
  }

  try {
    // 더미 이미지 생성 (1x1 PNG)
    const dummyImage = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    console.log("\n2. 더미 이미지 생성:");
    console.log(`   ✅ 더미 이미지 생성 완료 (${dummyImage.length} bytes)`);

    // 3. Supabase Storage에 업로드
    console.log("\n3. Supabase Storage 업로드:");
    const testNewsId = `test-${Date.now()}`;
    const imageUrl = await uploadNewsImage(testNewsId, dummyImage);
    console.log(`   ✅ 업로드 완료`);
    console.log(`   이미지 URL: ${imageUrl}`);

    console.log("\n✅ 이미지 업로드 테스트 성공!");
    console.log(`\n업로드된 이미지 확인: ${imageUrl}`);
    console.log("\n참고: 실제 AI 이미지 생성을 테스트하려면 다음 환경 변수를 설정하세요:");
    console.log("   - IMAGE_GENERATION_API: 'replicate', 'huggingface', 또는 'deepai'");
    console.log("   - 해당 API의 토큰/키 설정");
    return true;
  } catch (error) {
    console.error("\n❌ 이미지 업로드 테스트 실패:");
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
testImageUpload()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("예상치 못한 오류:", error);
    process.exit(1);
  });

