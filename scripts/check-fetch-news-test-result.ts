/**
 * fetch-news-test 워크플로우 최신 실행 결과 확인 및 분석
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

async function checkFetchNewsTestResult() {
  try {
    console.log("=== Fetch News Test 워크플로우 최신 실행 결과 확인 ===\n");

    const { listWorkflows, listWorkflowRuns, getWorkflowRun, listWorkflowRunJobs, getWorkflowRunLogsUrl } = await import("../lib/github/workflows");

    // 1. 워크플로우 찾기
    const workflows = await listWorkflows();
    const fetchNewsTest = workflows.workflows?.find((wf: any) => wf.name === "Fetch News Test");

    if (!fetchNewsTest) {
      console.error("❌ Fetch News Test 워크플로우를 찾을 수 없습니다.");
      process.exit(1);
    }

    // 2. 최신 실행 기록 조회 (완료된 것 우선)
    console.log("최신 실행 기록 조회 중...\n");
    let latestRun: any = null;

    // 먼저 완료된 실행 기록 확인
    const completedRuns = await listWorkflowRuns({
      workflowId: fetchNewsTest.id,
      status: "completed",
      perPage: 1,
    });

    if (completedRuns.workflow_runs && completedRuns.workflow_runs.length > 0) {
      latestRun = completedRuns.workflow_runs[0];
      console.log("✅ 완료된 실행 기록을 찾았습니다.\n");
    } else {
      // 완료된 것이 없으면 최신 실행 기록 확인
      const allRuns = await listWorkflowRuns({
        workflowId: fetchNewsTest.id,
        perPage: 5,
      });

      if (!allRuns.workflow_runs || allRuns.workflow_runs.length === 0) {
        console.error("❌ 실행 기록이 없습니다.");
        process.exit(1);
      }

      latestRun = allRuns.workflow_runs[0];

      // 실행 중이면 완료될 때까지 대기
      if (latestRun.status === "in_progress" || latestRun.status === "queued") {
        console.log("⏳ 워크플로우가 실행 중입니다. 완료될 때까지 대기합니다...\n");
        let attempts = 0;
        const maxAttempts = 300; // 최대 5분 대기

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 대기

          const updatedRuns = await listWorkflowRuns({
            workflowId: fetchNewsTest.id,
            perPage: 1,
          });

          if (updatedRuns.workflow_runs && updatedRuns.workflow_runs.length > 0) {
            const updatedRun = updatedRuns.workflow_runs[0];
            if (updatedRun.status === "completed") {
              latestRun = updatedRun;
              console.log(`✅ 워크플로우 실행 완료: ${updatedRun.conclusion}\n`);
              break;
            }
            if (attempts % 10 === 0) {
              console.log(`진행 중... (${attempts * 2}초 경과) - 상태: ${updatedRun.status}`);
            }
          }
          attempts++;
        }

        if (latestRun.status !== "completed") {
          console.log("⚠️  워크플로우가 아직 실행 중입니다. 현재 상태를 확인합니다.\n");
        }
      }
    }
    console.log(`최신 실행: Run #${latestRun.run_number}`);
    console.log(`상태: ${latestRun.status}`);
    console.log(`결과: ${latestRun.conclusion || "진행 중"}`);
    console.log(`생성 시간: ${new Date(latestRun.created_at).toLocaleString("ko-KR")}`);
    console.log(`URL: ${latestRun.html_url}\n`);

    // 3. 실행 상세 정보 조회
    const runDetails = await getWorkflowRun(latestRun.id);
    console.log("=== 실행 상세 정보 ===\n");
    console.log(`Run ID: ${runDetails.id}`);
    console.log(`Run Number: ${runDetails.run_number}`);
    console.log(`상태: ${runDetails.status}`);
    console.log(`결과: ${runDetails.conclusion || "진행 중"}`);
    console.log(`이벤트: ${runDetails.event}`);
    console.log(`브랜치: ${runDetails.head_branch}`);
    console.log(`커밋: ${runDetails.head_sha.substring(0, 7)}`);
    console.log(`시작 시간: ${new Date(runDetails.created_at).toLocaleString("ko-KR")}`);
    console.log(`업데이트 시간: ${new Date(runDetails.updated_at).toLocaleString("ko-KR")}`);
    console.log(`URL: ${runDetails.html_url}\n`);

    // 4. 작업 목록 조회
    const jobs = await listWorkflowRunJobs(latestRun.id);
    console.log("=== 작업 목록 ===\n");
    console.log(`총 작업 개수: ${jobs.total_count}\n`);

    if (jobs.jobs && jobs.jobs.length > 0) {
      for (const job of jobs.jobs) {
        console.log(`작업: ${job.name}`);
        console.log(`  상태: ${job.status}`);
        console.log(`  결과: ${job.conclusion || "진행 중"}`);
        if (job.started_at) {
          console.log(`  시작 시간: ${new Date(job.started_at).toLocaleString("ko-KR")}`);
        }
        if (job.completed_at) {
          console.log(`  완료 시간: ${new Date(job.completed_at).toLocaleString("ko-KR")}`);
          const duration = new Date(job.completed_at).getTime() - new Date(job.started_at || job.created_at).getTime();
          console.log(`  실행 시간: ${(duration / 1000).toFixed(2)}초`);
        }
        console.log(`  URL: ${job.html_url}\n`);

        // 단계별 정보
        if (job.steps && job.steps.length > 0) {
          console.log(`  단계:`);
          for (const step of job.steps) {
            const stepIcon = step.conclusion === "success" ? "✅" : step.conclusion === "failure" ? "❌" : "⏳";
            console.log(`    ${stepIcon} ${step.name} (${step.status}/${step.conclusion || "진행 중"})`);
          }
          console.log("");
        }
      }
    }

    // 5. 로그 URL
    const logsUrl = await getWorkflowRunLogsUrl(latestRun.id);
    if (logsUrl) {
      console.log(`로그 다운로드 URL: ${logsUrl}\n`);
    }

    // 6. 결과 요약
    console.log("=== 실행 결과 요약 ===\n");
    console.log(`워크플로우: ${runDetails.name}`);
    console.log(`상태: ${runDetails.status}`);
    console.log(`결과: ${runDetails.conclusion || "진행 중"}`);
    console.log(`실행 번호: #${runDetails.run_number}`);
    console.log(`URL: ${runDetails.html_url}\n`);

    return {
      runId: latestRun.id,
      runNumber: latestRun.run_number,
      status: runDetails.status,
      conclusion: runDetails.conclusion,
      htmlUrl: runDetails.html_url,
      logsUrl,
    };
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    if (error instanceof Error) {
      console.error("오류 메시지:", error.message);
      if (error.stack) {
        console.error("스택 트레이스:", error.stack);
      }
    }
    process.exit(1);
  }
}

checkFetchNewsTestResult().then((result) => {
  if (result) {
    console.log("\n✅ 확인 완료");
    process.exit(result.conclusion === "success" ? 0 : 1);
  }
});

