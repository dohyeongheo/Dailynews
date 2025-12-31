/**
 * 워크플로우 실행 결과 상세 확인 스크립트
 * 뉴스 수집, 번역, 이미지 생성 기능 확인
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

async function checkWorkflowResults() {
  try {
    console.log("=== 워크플로우 실행 결과 상세 확인 ===\n");

    const { listWorkflowRuns, getWorkflowRun, listWorkflowRunJobs } = await import("../lib/github/workflows");

    // 1. 최신 실행 기록 확인
    console.log("1단계: 최신 실행 기록 확인\n");
    const runs = await listWorkflowRuns({
      workflowId: 219054726, // Fetch News Daily ID
      perPage: 1
    });

    if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
      console.error("❌ 실행 기록을 찾을 수 없습니다.");
      process.exit(1);
    }

    const latestRun = runs.workflow_runs[0];
    console.log(`✅ 최신 실행: Run #${latestRun.run_number}`);
    console.log(`   상태: ${latestRun.status}`);
    console.log(`   결론: ${latestRun.conclusion || "진행 중"}`);
    console.log(`   URL: ${latestRun.html_url}\n`);

    // 2. 실행 상세 정보 확인
    const runDetails = await getWorkflowRun(latestRun.id);
    console.log("2단계: 실행 상세 정보\n");
    console.log(`실행 번호: #${runDetails.run_number}`);
    console.log(`상태: ${runDetails.status}`);
    console.log(`결론: ${runDetails.conclusion || "진행 중"}`);
    console.log(`이벤트: ${runDetails.event}`);
    console.log(`실행 시간: ${new Date(runDetails.created_at).toLocaleString("ko-KR")} ~ ${new Date(runDetails.updated_at).toLocaleString("ko-KR")}`);

    if (runDetails.status === "completed" && runDetails.conclusion === "success") {
      const duration = new Date(runDetails.updated_at).getTime() - new Date(runDetails.created_at).getTime();
      console.log(`총 실행 시간: ${(duration / 1000 / 60).toFixed(2)}분\n`);
    } else {
      console.log("\n");
    }

    // 3. 작업 목록 및 단계별 확인
    console.log("3단계: 작업 및 단계별 확인\n");
    const jobs = await listWorkflowRunJobs(latestRun.id);

    if (jobs.jobs && jobs.jobs.length > 0) {
      for (const job of jobs.jobs) {
        console.log(`작업: ${job.name}`);
        console.log(`  상태: ${job.status}`);
        console.log(`  결론: ${job.conclusion || "진행 중"}`);

        if (job.steps && job.steps.length > 0) {
          console.log(`  단계:`);
          for (const step of job.steps) {
            const stepIcon = step.conclusion === "success" ? "✅" : step.conclusion === "failure" ? "❌" : "⏳";
            console.log(`    ${stepIcon} ${step.name}`);
            console.log(`       상태: ${step.status}`);
            console.log(`       결론: ${step.conclusion || "진행 중"}`);
            if (step.completed_at && step.started_at) {
              const stepDuration = new Date(step.completed_at).getTime() - new Date(step.started_at).getTime();
              console.log(`       실행 시간: ${(stepDuration / 1000).toFixed(2)}초`);
            }
          }
        }
        console.log("");
      }
    }

    // 4. 데이터베이스에서 수집된 뉴스 확인
    console.log("4단계: 데이터베이스에서 수집된 뉴스 확인\n");

    try {
      // 오늘 날짜의 뉴스 확인
      const today = new Date().toISOString().split("T")[0];

      // Supabase MCP를 통해 뉴스 확인
      const newsQuery = `
        SELECT
          category,
          COUNT(*) as count,
          COUNT(CASE WHEN content_translated IS NOT NULL THEN 1 END) as translated_count,
          COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as image_count
        FROM news
        WHERE published_date = '${today}'
        GROUP BY category
        ORDER BY category;
      `;

      // 직접 Supabase 클라이언트 사용
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: newsStats, error } = await supabase.rpc('exec_sql', {
          query: newsQuery
        }).catch(async () => {
          // RPC가 없으면 직접 쿼리
          const { data, error } = await supabase
            .from('news')
            .select('category, content_translated, image_url')
            .eq('published_date', today);

          if (error) throw error;

          // 카테고리별 집계
          const stats: Record<string, { count: number; translated: number; images: number }> = {};
          data?.forEach((item: any) => {
            if (!stats[item.category]) {
              stats[item.category] = { count: 0, translated: 0, images: 0 };
            }
            stats[item.category].count++;
            if (item.content_translated) stats[item.category].translated++;
            if (item.image_url) stats[item.category].images++;
          });

          return { data: Object.entries(stats).map(([category, stats]) => ({ category, ...stats })), error: null };
        });

        if (error) {
          console.log("⚠️  데이터베이스 직접 쿼리 시도\n");
          // 직접 쿼리 시도
          const { data: newsData, error: queryError } = await supabase
            .from('news')
            .select('category, content_translated, image_url')
            .eq('published_date', today)
            .order('created_at', { ascending: false })
            .limit(100);

          if (queryError) {
            console.log(`⚠️  데이터베이스 쿼리 실패: ${queryError.message}\n`);
          } else if (newsData) {
            // 카테고리별 집계
            const stats: Record<string, { count: number; translated: number; images: number }> = {};
            newsData.forEach((item: any) => {
              if (!stats[item.category]) {
                stats[item.category] = { count: 0, translated: 0, images: 0 };
              }
              stats[item.category].count++;
              if (item.content_translated) stats[item.category].translated++;
              if (item.image_url) stats[item.category].images++;
            });

            console.log("📊 오늘 수집된 뉴스 통계:\n");
            for (const [category, stat] of Object.entries(stats)) {
              console.log(`  ${category}:`);
              console.log(`    총 개수: ${stat.count}개`);
              console.log(`    번역 완료: ${stat.translated}개 (${((stat.translated / stat.count) * 100).toFixed(1)}%)`);
              console.log(`    이미지 생성: ${stat.images}개 (${((stat.images / stat.count) * 100).toFixed(1)}%)`);
            }
            console.log(`\n  총합: ${newsData.length}개\n`);
          }
        } else if (newsStats) {
          console.log("📊 오늘 수집된 뉴스 통계:\n");
          (newsStats as any[]).forEach((stat: any) => {
            console.log(`  ${stat.category}:`);
            console.log(`    총 개수: ${stat.count}개`);
            console.log(`    번역 완료: ${stat.translated_count}개 (${((stat.translated_count / stat.count) * 100).toFixed(1)}%)`);
            console.log(`    이미지 생성: ${stat.image_count}개 (${((stat.image_count / stat.count) * 100).toFixed(1)}%)`);
          });
          console.log("");
        }
      } else {
        console.log("⚠️  Supabase 환경 변수가 설정되지 않아 데이터베이스 확인을 건너뜁니다.\n");
      }
    } catch (dbError: any) {
      console.log(`⚠️  데이터베이스 확인 중 오류: ${dbError.message}\n`);
    }

    // 5. 핵심 기능 확인 요약
    console.log("5단계: 핵심 기능 확인 요약\n");

    if (runDetails.status === "completed" && runDetails.conclusion === "success") {
      console.log("✅ 워크플로우 실행 성공\n");
      console.log("핵심 기능 상태:");
      console.log("  ✅ 뉴스 수집: 워크플로우 성공 (상세는 로그 확인)");
      console.log("  ✅ 한국어 번역: 워크플로우 성공 (상세는 로그 확인)");
      console.log("  ✅ 이미지 생성: 워크플로우 성공 (상세는 로그 확인)");
      console.log("\n⚠️  상세 로그는 GitHub Actions 페이지에서 확인하세요:");
      console.log(`   ${runDetails.html_url}`);
    } else if (runDetails.status === "in_progress" || runDetails.status === "queued") {
      console.log("⏳ 워크플로우 실행 중...\n");
      console.log("실행이 완료되면 다시 확인하세요.");
    } else {
      console.log(`❌ 워크플로우 실행 실패: ${runDetails.conclusion}\n`);
      console.log("상세 오류는 GitHub Actions 페이지에서 확인하세요:");
      console.log(`   ${runDetails.html_url}`);
    }

    console.log("\n=== 확인 완료 ===\n");

  } catch (error: any) {
    console.error("\n❌ 오류 발생:");
    console.error("메시지:", error.message);
    if (error.status) {
      console.error("상태 코드:", error.status);
    }
    process.exit(1);
  }
}

checkWorkflowResults();

