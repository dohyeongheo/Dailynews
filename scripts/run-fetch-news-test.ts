/**
 * fetch-news-test 워크플로우 실행 및 결과 확인 스크립트
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

async function runFetchNewsTest() {
  try {
    console.log("=== Fetch News Test 워크플로우 실행 및 결과 확인 ===\n");

    const { listWorkflows, createWorkflowDispatch, listWorkflowRuns, getWorkflowRun, listWorkflowRunJobs } = await import("../lib/github/workflows");
    const { log } = await import("../lib/utils/logger");

    // 1. 워크플로우 목록 조회하여 Fetch News Test ID 확인
    console.log("1단계: 워크플로우 목록 조회\n");
    const workflows = await listWorkflows();
    const fetchNewsTest = workflows.workflows?.find((wf: any) => wf.name === "Fetch News Test");

    if (!fetchNewsTest) {
      console.error("❌ Fetch News Test 워크플로우를 찾을 수 없습니다.");
      process.exit(1);
    }

    console.log(`✅ Fetch News Test 워크플로우 찾음`);
    console.log(`   ID: ${fetchNewsTest.id}`);
    console.log(`   경로: ${fetchNewsTest.path}`);
    console.log(`   상태: ${fetchNewsTest.state}\n`);

    // 2. 워크플로우 실행
    console.log("2단계: 워크플로우 실행\n");
    try {
      await createWorkflowDispatch(fetchNewsTest.id, "main");
      console.log("✅ 워크플로우 실행 요청 성공\n");
    } catch (error: any) {
      if (error.message?.includes("already in progress") || error.message?.includes("already running")) {
        console.log("⚠️  워크플로우가 이미 실행 중입니다. 기존 실행을 확인합니다.\n");
      } else {
        throw error;
      }
    }

    // 3. 최신 실행 기록 확인 (최대 60초 대기)
    console.log("3단계: 실행 결과 확인\n");
    let latestRun: any = null;
    let attempts = 0;
    const maxAttempts = 60; // 60초 대기 (테스트는 더 짧을 수 있음)

    while (attempts < maxAttempts) {
      const runs = await listWorkflowRuns({
        workflowId: fetchNewsTest.id,
        perPage: 5,
      });

      if (runs.workflow_runs && runs.workflow_runs.length > 0) {
        latestRun = runs.workflow_runs[0];
        const runStatus = latestRun.status;
        const conclusion = latestRun.conclusion;

        console.log(`시도 ${attempts + 1}/${maxAttempts}: Run #${latestRun.run_number} - ${runStatus}${conclusion ? ` (${conclusion})` : ""}`);

        if (runStatus === "completed") {
          console.log(`\n✅ 워크플로우 실행 완료: ${conclusion}\n`);
          break;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
      }
    }

    if (!latestRun) {
      console.error("❌ 워크플로우 실행 기록을 찾을 수 없습니다.");
      process.exit(1);
    }

    // 4. 실행 상세 정보 조회
    console.log("4단계: 실행 상세 정보 조회\n");
    const runDetails = await getWorkflowRun(latestRun.id);
    console.log(`Run ID: ${runDetails.id}`);
    console.log(`Run Number: ${runDetails.run_number}`);
    console.log(`상태: ${runDetails.status}`);
    console.log(`결과: ${runDetails.conclusion || "진행 중"}`);
    console.log(`시작 시간: ${new Date(runDetails.created_at).toLocaleString("ko-KR")}`);
    console.log(`완료 시간: ${runDetails.updated_at ? new Date(runDetails.updated_at).toLocaleString("ko-KR") : "진행 중"}`);
    console.log(`URL: ${runDetails.html_url}\n`);

    // 5. 작업(Job) 목록 조회
    console.log("5단계: 작업(Job) 목록 조회\n");
    const jobs = await listWorkflowRunJobs(latestRun.id);
    if (jobs.jobs && jobs.jobs.length > 0) {
      jobs.jobs.forEach((job: any) => {
        console.log(`Job: ${job.name}`);
        console.log(`   상태: ${job.status}`);
        console.log(`   결과: ${job.conclusion || "진행 중"}`);
        console.log(`   시작 시간: ${new Date(job.started_at).toLocaleString("ko-KR")}`);
        if (job.completed_at) {
          console.log(`   완료 시간: ${new Date(job.completed_at).toLocaleString("ko-KR")}`);
        }
        console.log(`   URL: ${job.html_url}\n`);
      });
    }

    // 6. 로그 URL 조회
    console.log("6단계: 로그 정보\n");
    const logsUrl = await import("../lib/github/workflows").then((m) => m.getWorkflowRunLogsUrl(latestRun.id));
    if (logsUrl) {
      console.log(`로그 다운로드 URL: ${logsUrl}\n`);
    } else {
      console.log("로그 URL을 가져올 수 없습니다.\n");
    }

    // 7. 결과 요약
    console.log("=== 실행 결과 요약 ===\n");
    console.log(`워크플로우: ${runDetails.name}`);
    console.log(`상태: ${runDetails.status}`);
    console.log(`결과: ${runDetails.conclusion || "진행 중"}`);
    console.log(`실행 번호: #${runDetails.run_number}`);
    console.log(`URL: ${runDetails.html_url}\n`);

    if (runDetails.conclusion === "success") {
      console.log("✅ 워크플로우가 성공적으로 완료되었습니다!");
      process.exit(0);
    } else if (runDetails.conclusion === "failure") {
      console.error("❌ 워크플로우가 실패했습니다.");
      console.error("위의 로그 URL을 확인하여 실패 원인을 파악하세요.");
      process.exit(1);
    } else {
      console.log("⏳ 워크플로우가 아직 실행 중입니다.");
      console.log("나중에 다시 확인하거나 위의 URL에서 직접 확인하세요.");
      process.exit(0);
    }
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

runFetchNewsTest();



