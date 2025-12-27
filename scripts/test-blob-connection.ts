/**
 * Vercel Blob Storage 연결 테스트 스크립트
 */
import { put, list } from "@vercel/blob";
import * as dotenv from "dotenv";

// 환경 변수 로드
dotenv.config({ path: ".env.local" });
dotenv.config();

async function testBlobConnection() {
  console.log("=== Vercel Blob Storage 연결 테스트 ===\n");

  // 환경 변수 확인
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  console.log("1. 환경 변수 확인:");
  console.log(`   BLOB_READ_WRITE_TOKEN: ${blobToken ? "✅ 설정됨" : "❌ 설정되지 않음"}`);
  if (!blobToken) {
    console.error("\n❌ BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다.");
    console.log("   Vercel 대시보드에서 환경 변수를 확인하세요.");
    process.exit(1);
  }

  // 테스트 파일 업로드
  console.log("\n2. 테스트 파일 업로드:");
  try {
    const testContent = Buffer.from("테스트 파일 내용");
    const testFilename = `test/connection-test-${Date.now()}.txt`;

    const blob = await put(testFilename, testContent, {
      access: "public",
      contentType: "text/plain",
    });

    console.log(`   ✅ 업로드 성공`);
    console.log(`   URL: ${blob.url}`);
    console.log(`   Pathname: ${blob.pathname}`);

    // 파일 목록 조회
    console.log("\n3. 파일 목록 조회:");
    const { blobs } = await list({ prefix: "test/" });
    console.log(`   ✅ 조회 성공 (${blobs.length}개 파일)`);
    if (blobs.length > 0) {
      console.log(`   최근 파일: ${blobs[0].pathname}`);
    }

    console.log("\n✅ Vercel Blob Storage 연결 테스트 성공!");
    return true;
  } catch (error) {
    console.error("\n❌ Vercel Blob Storage 연결 테스트 실패:");
    console.error(error instanceof Error ? error.message : String(error));
    return false;
  }
}

// 스크립트 실행
testBlobConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("예상치 못한 오류:", error);
    process.exit(1);
  });

