/**
 * Fetch News 워크플로우 실행 로그 확인 스크립트
 * GitHub REST API를 통해 최근 실행 로그를 확인하고 22개만 수집된 원인을 파악
 */

import { config } from "dotenv";
import { resolve } from "path";
import { Octokit } from "@octokit/rest";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

async function checkFetchNewsLogs() {
  try {
    console.log("=== Fetch News 워크플로우 실행 로그 확인 ===\n");

    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
      console.error("❌ GITHUB_TOKEN 또는 GITHUB_PERSONAL_ACCESS_TOKEN이 설정되지 않았습니다.");
      process.exit(1);
    }

    const octokit = new Octokit({ auth: token });
    const owner = "dohyeongheo";
    const repo = "Dailynews";

    // 1. 워크플로우 찾기
    console.log("1단계: Fetch News Daily 워크플로우 찾기\n");
    const { data: workflows } = await octokit.rest.actions.listWorkflowsForRepo({
      owner,
      repo,
    });

    const fetchNewsWorkflow = workflows.workflows.find((wf) => wf.name === "Fetch News Daily");
    if (!fetchNewsWorkflow) {
      console.error("❌ Fetch News Daily 워크플로우를 찾을 수 없습니다.");
      process.exit(1);
    }

    console.log(`✅ 워크플로우 찾음: ${fetchNewsWorkflow.name} (ID: ${fetchNewsWorkflow.id})\n`);

    // 2. 최신 실행 기록 조회
    console.log("2단계: 최신 실행 기록 조회\n");
    const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: fetchNewsWorkflow.id,
      per_page: 1,
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

    // 3. 실행 상세 정보 확인
    console.log("3단계: 실행 상세 정보\n");
    const { data: runDetails } = await octokit.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: latestRun.id,
    });

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

    // 4. 작업 목록 및 로그 확인
    console.log("4단계: 작업 및 단계별 확인\n");
    const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: latestRun.id,
    });

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

    // 5. 로그 다운로드 시도 (Fetch and save news 단계)
    console.log("5단계: Fetch and save news 단계 로그 확인\n");
    try {
      const fetchNewsJob = jobs.jobs?.find((job) => job.name === "fetch-news");
      if (fetchNewsJob) {
        const { data: logs } = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
          owner,
          repo,
          job_id: fetchNewsJob.id,
        });

        // 로그를 문자열로 변환 (ArrayBuffer인 경우)
        let logText: string;
        if (typeof logs === "string") {
          logText = logs;
        } else if (logs instanceof ArrayBuffer) {
          logText = new TextDecoder().decode(logs);
        } else {
          logText = String(logs);
        }

        // 뉴스 수집 관련 로그 추출
        const lines = logText.split("\n");
        const newsCollectionLines = lines.filter(
          (line) =>
            line.includes("뉴스 수집") ||
            line.includes("성공") ||
            line.includes("실패") ||
            line.includes("전체") ||
            line.includes("개") ||
            line.includes("news")
        );

        if (newsCollectionLines.length > 0) {
          console.log("📰 뉴스 수집 관련 로그:\n");
          newsCollectionLines.slice(-20).forEach((line) => {
            console.log(`  ${line}`);
          });
          console.log("");
        } else {
          console.log("⚠️  뉴스 수집 관련 로그를 찾을 수 없습니다.\n");
        }
      } else {
        console.log("⚠️  fetch-news 작업을 찾을 수 없습니다.\n");
      }
    } catch (logError: any) {
      console.log(`⚠️  로그 다운로드 실패: ${logError.message}\n`);
    }

    // 6. 데이터베이스에서 수집된 뉴스 확인
    console.log("6단계: 데이터베이스에서 수집된 뉴스 확인\n");
    try {
      const today = new Date().toISOString().split("T")[0];
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: newsData, error } = await supabase
          .from("news")
          .select("category")
          .eq("published_date", today)
          .order("created_at", { ascending: false });

        if (error) {
          console.log(`⚠️  데이터베이스 쿼리 실패: ${error.message}\n`);
        } else if (newsData) {
          // 카테고리별 집계
          const stats: Record<string, number> = {};
          newsData.forEach((item: any) => {
            stats[item.category] = (stats[item.category] || 0) + 1;
          });

          console.log(`📊 ${today} 수집된 뉴스 통계:\n`);
          console.log(`  태국뉴스: ${stats["태국뉴스"] || 0}개`);
          console.log(`  한국뉴스: ${stats["한국뉴스"] || 0}개`);
          console.log(`  관련뉴스: ${stats["관련뉴스"] || 0}개`);
          console.log(`  총합: ${newsData.length}개\n`);

          // 원인 분석
          if (newsData.length < 30) {
            console.log("🔍 원인 분석:\n");
            console.log(`  목표: 30개 (카테고리별 10개씩)`);
            console.log(`  실제: ${newsData.length}개`);
            console.log(`  부족: ${30 - newsData.length}개\n`);
            console.log("  가능한 원인:");
            console.log("    1. Gemini API가 정확히 30개를 반환하지 않음");
            console.log("    2. 프롬프트에 '최소 20개 이상'만 명시되어 있어 모호함");
            console.log("    3. 코드 레벨에서 카테고리별 제한 로직이 없음");
            console.log("    4. 번역 실패로 인한 뉴스 제외\n");
          }
        }
      } else {
        console.log("⚠️  Supabase 환경 변수가 설정되지 않아 데이터베이스 확인을 건너뜁니다.\n");
      }
    } catch (dbError: any) {
      console.log(`⚠️  데이터베이스 확인 중 오류: ${dbError.message}\n`);
    }

    console.log("=== 확인 완료 ===\n");
  } catch (error: any) {
    console.error("\n❌ 오류 발생:");
    console.error("메시지:", error.message);
    if (error.status) {
      console.error("상태 코드:", error.status);
    }
    if (error.response) {
      console.error("응답 데이터:", error.response.data);
    }
    process.exit(1);
  }
}

checkFetchNewsLogs();

