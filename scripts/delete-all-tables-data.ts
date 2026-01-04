/**
 * Supabase의 모든 테이블 데이터를 삭제하는 스크립트
 * 외래 키 제약 조건을 고려하여 올바른 순서로 삭제합니다.
 */

// .env.local 파일을 가장 먼저 로드 (다른 모듈 import 전에)
import "./load-env";

import { supabaseServer } from "@/lib/supabase/server";

async function deleteAllTablesData() {
  console.log("🚀 모든 테이블의 데이터 삭제를 시작합니다...\n");

  // 외래 키 제약 조건을 고려한 삭제 순서
  const tables = [
    "comment_reactions", // comments 참조
    "news_reactions",    // news, users 참조
    "comments",          // news, users 참조
    "bookmarks",         // users, news 참조
    "news",              // 독립 테이블
    "users",             // 독립 테이블
  ];

  const results: Array<{ table: string; success: boolean; error?: string; deletedCount?: number }> = [];

  for (const table of tables) {
    try {
      console.log(`📋 ${table} 테이블 데이터 삭제 중...`);

      // 먼저 데이터 개수 확인
      const { count: beforeCount } = await supabaseServer
        .from(table)
        .select("*", { count: "exact", head: true });

      // 데이터 삭제
      const { error, count } = await supabaseServer
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // 모든 행 삭제 (더미 조건 사용)

      if (error) {
        throw error;
      }

      const deletedCount = beforeCount || 0;
      console.log(`✅ ${table}: ${deletedCount}개 행 삭제 완료\n`);

      results.push({
        table,
        success: true,
        deletedCount,
      });
    } catch (error: any) {
      console.error(`❌ ${table} 삭제 실패:`, error.message);
      results.push({
        table,
        success: false,
        error: error.message,
      });
    }
  }

  // 결과 요약
  console.log("\n" + "=".repeat(50));
  console.log("📊 삭제 결과 요약");
  console.log("=".repeat(50));

  let totalDeleted = 0;
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.table}: ${result.deletedCount || 0}개 행 삭제`);
      totalDeleted += result.deletedCount || 0;
    } else {
      console.log(`❌ ${result.table}: 삭제 실패 - ${result.error}`);
    }
  }

  console.log(`\n총 ${totalDeleted}개 행이 삭제되었습니다.`);

  // 최종 확인: 모든 테이블이 비어있는지 확인
  console.log("\n🔍 최종 확인 중...\n");
  for (const table of tables) {
    const { count } = await supabaseServer
      .from(table)
      .select("*", { count: "exact", head: true });

    if (count && count > 0) {
      console.log(`⚠️  ${table}: 아직 ${count}개 행이 남아있습니다.`);
    } else {
      console.log(`✅ ${table}: 비어있음`);
    }
  }

  console.log("\n✨ 모든 작업이 완료되었습니다!");
}

// 스크립트 실행
if (require.main === module) {
  deleteAllTablesData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 오류 발생:", error);
      process.exit(1);
    });
}

export { deleteAllTablesData };

