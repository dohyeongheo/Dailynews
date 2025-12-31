/**
 * Fetch News Daily 워크플로우 실행 및 결과 확인 스크립트
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

async function runFetchNewsDaily() {
  try {
    console.log("=== Fetch News Daily 워크플로우 실행 및 결과 확인 ===\n");

    const { listWorkflows, createWorkflowDispatch, listWorkflowRuns, getWorkflowRun, listWorkflowRunJobs } = await import("../lib/github/workflows");
    const { log } = await import("../lib/utils/logger");

    // 1. 워크플로우 목록 조회하여 Fetch News Daily ID 확인
    console.log("1단계: 워크플로우 목록 조회\n");
    const workflows = await listWorkflows();
    const fetchNewsDaily = workflows.workflows?.find((wf: any) => wf.name === "Fetch News Daily");

    if (!fetchNewsDaily) {
      console.error("❌ Fetch News Daily 워크플로우를 찾을 수 없습니다.");
      process.exit(1);
    }

    console.log(`✅ Fetch News Daily 워크플로우 찾음`);
    console.log(`   ID: ${fetchNewsDaily.id}`);
    console.log(`   경로: ${fetchNewsDaily.path}`);
    console.log(`   상태: ${fetchNewsDaily.state}\n`);

    // 2. 워크플로우 실행
    console.log("2단계: 워크플로우 실행\n");
    try {
      await createWorkflowDispatch(fetchNewsDaily.id, "main");
      console.log("✅ 워크플로우 실행 요청 성공\n");
    } catch (error: any) {
      if (error.message?.includes("already in progress") || error.message?.includes("already running")) {
        console.log("⚠️  워크플로우가 이미 실행 중입니다. 기존 실행을 확인합니다.\n");
      } else {
        throw error;
      }
    }

    // 3. 최신 실행 기록 확인 (최대 30초 대기)
    console.log("3단계: 실행 결과 확인\n");
    let latestRun: any = null;
    let attempts = 0;
    const maxAttempts = 30; // 30초 대기

    while (attempts < maxAttempts) {
      const runs = await listWorkflowRuns({
        workflowId: fetchNewsDaily.id,
        perPage: 1
      });

      if (runs.workflow_runs && runs.workflow_runs.length > 0) {
        latestRun = runs.workflow_runs[0];

        // 방금 실행한 워크플로우인지 확인 (1분 이내)
        const runTime = new Date(latestRun.created_at).getTime();
        const now = Date.now();
        const timeDiff = now - runTime;

        if (timeDiff < 60000) { // 1분 이내
          console.log(`✅ 최신 실행 기록 찾음: Run #${latestRun.run_number}`);
          console.log(`   상태: ${latestRun.status}`);
          console.log(`   결론: ${latestRun.conclusion || "진행 중"}`);
          console.log(`   생성 시간: ${new Date(latestRun.created_at).toLocaleString("ko-KR")}\n`);
          break;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        process.stdout.write(".");
      }
    }

    if (!latestRun) {
      console.log("\n⚠️  최신 실행 기록을 찾을 수 없습니다. 기존 실행 기록을 확인합니다.\n");
      const runs = await listWorkflowRuns({
        workflowId: fetchNewsDaily.id,
        perPage: 1
      });
      if (runs.workflow_runs && runs.workflow_runs.length > 0) {
        latestRun = runs.workflow_runs[0];
      }
    }

    if (!latestRun) {
      console.error("❌ 실행 기록을 찾을 수 없습니다.");
      process.exit(1);
    }

    // 4. 실행 상세 정보 확인
    console.log("\n4단계: 실행 상세 정보 확인\n");
    const runDetails = await getWorkflowRun(latestRun.id);
    console.log(`실행 번호: #${runDetails.run_number}`);
    console.log(`상태: ${runDetails.status}`);
    console.log(`결론: ${runDetails.conclusion || "진행 중"}`);
    console.log(`이벤트: ${runDetails.event}`);
    console.log(`브랜치: ${runDetails.head_branch}`);
    console.log(`커밋: ${runDetails.head_sha.substring(0, 7)}`);
    console.log(`생성 시간: ${new Date(runDetails.created_at).toLocaleString("ko-KR")}`);
    console.log(`업데이트 시간: ${new Date(runDetails.updated_at).toLocaleString("ko-KR")}`);
    console.log(`URL: ${runDetails.html_url}\n`);

    // 5. 작업 목록 확인
    console.log("5단계: 작업 목록 확인\n");
    const jobs = await listWorkflowRunJobs(latestRun.id);
    console.log(`총 작업 개수: ${jobs.total_count}`);

    if (jobs.jobs && jobs.jobs.length > 0) {
      for (const job of jobs.jobs) {
        console.log(`\n작업: ${job.name}`);
        console.log(`  상태: ${job.status}`);
        console.log(`  결론: ${job.conclusion || "진행 중"}`);
        if (job.started_at) {
          console.log(`  시작 시간: ${new Date(job.started_at).toLocaleString("ko-KR")}`);
        }
        if (job.completed_at) {
          console.log(`  완료 시간: ${new Date(job.completed_at).toLocaleString("ko-KR")}`);
          const duration = new Date(job.completed_at).getTime() - new Date(job.started_at || job.created_at).getTime();
          console.log(`  실행 시간: ${(duration / 1000).toFixed(2)}초`);
        }
        console.log(`  URL: ${job.html_url}`);

        // 단계별 정보
        if (job.steps && job.steps.length > 0) {
          console.log(`  단계:`);
          for (const step of job.steps) {
            const stepIcon = step.conclusion === "success" ? "✅" : step.conclusion === "failure" ? "❌" : "⏳";
            console.log(`    ${stepIcon} ${step.name} (${step.status}/${step.conclusion || "진행 중"})`);
          }
        }
      }
    }

    // 6. 실행 완료 대기 및 최종 결과 확인
    if (runDetails.status === "in_progress" || runDetails.status === "queued") {
      console.log("\n6단계: 실행 완료 대기 (최대 5분)\n");
      let finalStatus = runDetails.status;
      let waitAttempts = 0;
      const maxWaitAttempts = 300; // 5분 (300초)

      while ((finalStatus === "in_progress" || finalStatus === "queued") && waitAttempts < maxWaitAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        const updatedRun = await getWorkflowRun(latestRun.id);
        finalStatus = updatedRun.status;

        if (waitAttempts % 10 === 0) { // 20초마다 상태 출력
          console.log(`진행 중... (${waitAttempts * 2}초 경과) - 상태: ${finalStatus}`);
        }

        waitAttempts++;
      }

      if (finalStatus === "completed") {
        const finalRun = await getWorkflowRun(latestRun.id);
        console.log(`\n✅ 실행 완료: ${finalRun.conclusion}\n`);

        // 최종 작업 목록 확인
        const finalJobs = await listWorkflowRunJobs(latestRun.id);
        if (finalJobs.jobs && finalJobs.jobs.length > 0) {
          for (const job of finalJobs.jobs) {
            console.log(`작업: ${job.name} - ${job.conclusion || job.status}`);
          }
        }
      } else {
        console.log(`\n⚠️  실행이 아직 진행 중입니다. 상태: ${finalStatus}`);
        console.log(`   URL에서 직접 확인하세요: ${runDetails.html_url}\n`);
      }
    } else if (runDetails.status === "completed") {
      console.log(`\n✅ 실행 완료: ${runDetails.conclusion}\n`);
    }

    console.log("\n=== 확인 완료 ===\n");
    console.log(`워크플로우 URL: ${runDetails.html_url}`);
    console.log("\n핵심 기능 확인:");
    console.log("  - 뉴스 수집: 워크플로우 로그에서 확인 필요");
    console.log("  - 한국어 번역: 워크플로우 로그에서 확인 필요");
    console.log("  - 이미지 생성: 워크플로우 로그에서 확인 필요");
    console.log("\n상세 로그는 위 URL에서 확인할 수 있습니다.");

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

runFetchNewsDaily();

