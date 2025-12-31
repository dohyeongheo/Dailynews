#!/usr/bin/env tsx

/**
 * GitHub 워크플로우 관련 CLI 스크립트
 */

import { listWorkflows, listWorkflowRuns, getWorkflowRun, listWorkflowRunJobs } from "../../lib/github/workflows";

const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  try {
    switch (command) {
      case "list":
        await handleList();
        break;
      case "show":
        if (!arg) {
          console.error("❌ runId가 필요합니다.");
          console.log("사용법: npm run github:workflows show <runId>");
          process.exit(1);
        }
        await handleShow(Number(arg));
        break;
      case "runs":
        await handleRuns();
        break;
      default:
        console.log("사용 가능한 명령어:");
        console.log("  list  - 워크플로우 목록 조회");
        console.log("  runs  - 워크플로우 실행 기록 조회");
        console.log("  show <runId> - 특정 실행 상세 정보");
        break;
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleList() {
  console.log("📋 워크플로우 목록 조회 중...\n");
  const workflows = await listWorkflows();

  console.log(`총 ${workflows.total_count}개 워크플로우\n`);
  workflows.workflows.forEach((workflow) => {
    console.log(`  ${workflow.name}`);
    console.log(`    ID: ${workflow.id}`);
    console.log(`    경로: ${workflow.path}`);
    console.log(`    상태: ${workflow.state}`);
    console.log(`    생성일: ${new Date(workflow.created_at).toLocaleString("ko-KR")}`);
    console.log("");
  });
}

async function handleRuns() {
  console.log("📋 워크플로우 실행 기록 조회 중...\n");
  const runs = await listWorkflowRuns({ perPage: 10 });

  console.log(`총 ${runs.total_count}개 실행 기록\n`);
  runs.workflow_runs.forEach((run) => {
    const conclusion = run.conclusion || run.status;
    const conclusionIcon = run.conclusion === "success" ? "✅" : run.conclusion === "failure" ? "❌" : "⏳";
    console.log(`${conclusionIcon} ${run.name} - Run #${run.run_number}`);
    console.log(`    브랜치: ${run.head_branch}`);
    console.log(`    이벤트: ${run.event}`);
    console.log(`    상태: ${conclusion}`);
    console.log(`    실행 시간: ${new Date(run.created_at).toLocaleString("ko-KR")}`);
    console.log(`    URL: ${run.html_url}`);
    console.log("");
  });
}

async function handleShow(runId: number) {
  console.log(`📋 워크플로우 실행 #${runId} 상세 정보 조회 중...\n`);

  const run = await getWorkflowRun(runId);
  console.log(`워크플로우: ${run.name}`);
  console.log(`실행 번호: #${run.run_number}`);
  console.log(`브랜치: ${run.head_branch}`);
  console.log(`커밋: ${run.head_sha.substring(0, 7)}`);
  console.log(`이벤트: ${run.event}`);
  console.log(`상태: ${run.status}`);
  console.log(`결론: ${run.conclusion || "진행 중"}`);
  console.log(`생성일: ${new Date(run.created_at).toLocaleString("ko-KR")}`);
  console.log(`업데이트: ${new Date(run.updated_at).toLocaleString("ko-KR")}`);
  console.log(`URL: ${run.html_url}`);
  console.log("");

  // 작업 목록 조회
  console.log("📋 작업 목록:");
  const jobs = await listWorkflowRunJobs(runId);
  jobs.jobs.forEach((job) => {
    const conclusion = job.conclusion || job.status;
    const conclusionIcon = job.conclusion === "success" ? "✅" : job.conclusion === "failure" ? "❌" : "⏳";
    console.log(`  ${conclusionIcon} ${job.name}`);
    console.log(`    상태: ${conclusion}`);
    if (job.started_at) {
      console.log(`    시작: ${new Date(job.started_at).toLocaleString("ko-KR")}`);
    }
    if (job.completed_at) {
      console.log(`    완료: ${new Date(job.completed_at).toLocaleString("ko-KR")}`);
    }
    console.log(`    URL: ${job.html_url}`);
    console.log("");
  });
}

main();


