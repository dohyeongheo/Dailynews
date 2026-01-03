/**
 * fetch-news-test 워크플로우 로그 분석 스크립트
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

async function analyzeLogs() {
  try {
    console.log("=== Fetch News Test 워크플로우 로그 분석 ===\n");

    const { listWorkflows, listWorkflowRuns, getWorkflowRun, listWorkflowRunJobs } = await import("../lib/github/workflows");
    const { getOctokitClient } = await import("../lib/github/client");
    const { getRepositoryInfo } = await import("../lib/github/client");

    const { owner, repo } = getRepositoryInfo();
    const octokit = getOctokitClient();

    // 1. 워크플로우 찾기
    const workflows = await listWorkflows();
    const fetchNewsTest = workflows.workflows?.find((wf: any) => wf.name === "Fetch News Test");

    if (!fetchNewsTest) {
      console.error("❌ Fetch News Test 워크플로우를 찾을 수 없습니다.");
      process.exit(1);
    }

    // 2. 최신 완료된 실행 기록 조회
    const completedRuns = await listWorkflowRuns({
      workflowId: fetchNewsTest.id,
      status: "completed",
      perPage: 1,
    });

    if (!completedRuns.workflow_runs || completedRuns.workflow_runs.length === 0) {
      console.error("❌ 완료된 실행 기록이 없습니다.");
      process.exit(1);
    }

    const latestRun = completedRuns.workflow_runs[0];
    console.log(`최신 완료된 실행: Run #${latestRun.run_number}`);
    console.log(`결과: ${latestRun.conclusion}`);
    console.log(`URL: ${latestRun.html_url}\n`);

    // 3. 작업 목록 조회
    const jobs = await listWorkflowRunJobs(latestRun.id);
    if (!jobs.jobs || jobs.jobs.length === 0) {
      console.error("❌ 작업 정보를 찾을 수 없습니다.");
      process.exit(1);
    }

    const job = jobs.jobs[0];
    console.log(`작업: ${job.name}`);
    console.log(`결과: ${job.conclusion}`);
    console.log(`실행 시간: ${job.completed_at && job.started_at ? ((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000).toFixed(2) + "초" : "알 수 없음"}\n`);

    // 4. 로그 다운로드 시도
    console.log("=== 로그 분석 ===\n");
    try {
      const logsResponse = await octokit.rest.actions.downloadWorkflowRunLogs({
        owner,
        repo,
        run_id: latestRun.id,
      });

      // 로그는 ZIP 파일로 제공됨
      console.log("✅ 로그 다운로드 성공");
      console.log(`로그 크기: ${(logsResponse.data as any).length || "알 수 없음"} bytes\n`);

      // ZIP 파일을 파싱하여 로그 내용 추출 (간단한 분석)
      console.log("⚠️  로그는 ZIP 파일 형식입니다. 상세 내용은 GitHub 웹 인터페이스에서 확인하세요.");
      console.log(`로그 URL: https://github.com/${owner}/${repo}/actions/runs/${latestRun.id}\n`);
    } catch (error: any) {
      console.log("⚠️  로그 다운로드 실패 (로그는 GitHub 웹 인터페이스에서 확인 가능)");
      console.log(`로그 URL: https://github.com/${owner}/${repo}/actions/runs/${latestRun.id}\n`);
    }

    // 5. 단계별 결과 요약
    console.log("=== 단계별 실행 결과 ===\n");
    if (job.steps && job.steps.length > 0) {
      for (const step of job.steps) {
        const stepIcon = step.conclusion === "success" ? "✅" : step.conclusion === "failure" ? "❌" : "⏳";
        console.log(`${stepIcon} ${step.name}`);
        console.log(`   상태: ${step.status}`);
        console.log(`   결과: ${step.conclusion || "진행 중"}`);
        if (step.completed_at && step.started_at) {
          const duration = (new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) / 1000;
          console.log(`   실행 시간: ${duration.toFixed(2)}초`);
        }
        console.log("");
      }
    }

    // 6. 결과 요약
    console.log("=== 실행 결과 요약 ===\n");
    console.log(`워크플로우: ${latestRun.name}`);
    console.log(`실행 번호: #${latestRun.run_number}`);
    console.log(`상태: ${latestRun.status}`);
    console.log(`결과: ${latestRun.conclusion}`);
    console.log(`시작 시간: ${new Date(latestRun.created_at).toLocaleString("ko-KR")}`);
    console.log(`완료 시간: ${new Date(latestRun.updated_at).toLocaleString("ko-KR")}`);
    console.log(`URL: ${latestRun.html_url}\n`);

    return {
      runId: latestRun.id,
      runNumber: latestRun.run_number,
      conclusion: latestRun.conclusion,
      htmlUrl: latestRun.html_url,
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

analyzeLogs().then((result) => {
  if (result) {
    console.log("\n✅ 로그 분석 완료");
    console.log(`상세 로그는 다음 URL에서 확인하세요: ${result.htmlUrl}`);
    process.exit(result.conclusion === "success" ? 0 : 1);
  }
});



