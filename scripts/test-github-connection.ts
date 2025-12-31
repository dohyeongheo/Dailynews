/**
 * GitHub REST API 연결 테스트 스크립트
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

async function testGitHubConnection() {
  try {
    console.log("=== 1단계: GitHub Token 확인 ===\n");

    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
      console.error("❌ GITHUB_TOKEN 또는 GITHUB_PERSONAL_ACCESS_TOKEN이 설정되지 않았습니다.");
      console.log("\n.env.local 파일에 다음을 추가하세요:");
      console.log("GITHUB_TOKEN=your_token_here");
      return;
    }

    console.log("✅ GitHub Token이 설정되어 있습니다.");
    console.log(`Token 길이: ${token.length}자`);
    console.log(`Token 시작: ${token.substring(0, 4)}...`);

    console.log("\n=== 2단계: GitHub REST API 연결 테스트 ===\n");

    const { getOctokitClient, getRepositoryInfo } = await import("../lib/github/client");
    const { listWorkflows, listWorkflowRuns } = await import("../lib/github/workflows");

    const { owner, repo } = getRepositoryInfo();
    console.log(`Repository: ${owner}/${repo}`);

    const octokit = getOctokitClient();
    console.log("✅ Octokit 클라이언트 생성 성공");

    // 워크플로우 목록 조회 테스트
    console.log("\n--- 워크플로우 목록 조회 테스트 ---");
    const workflows = await listWorkflows();
    console.log(`✅ 워크플로우 목록 조회 성공`);
    console.log(`총 워크플로우 개수: ${workflows.total_count}`);
    console.log(`워크플로우 배열 길이: ${workflows.workflows?.length || 0}`);

    if (workflows.workflows && workflows.workflows.length > 0) {
      console.log("\n워크플로우 목록:");
      workflows.workflows.slice(0, 3).forEach((wf: any) => {
        console.log(`  - ${wf.name} (ID: ${wf.id})`);
      });
    }

    // 워크플로우 실행 기록 조회 테스트
    console.log("\n--- 워크플로우 실행 기록 조회 테스트 ---");
    const runs = await listWorkflowRuns({ perPage: 5 });
    console.log(`✅ 워크플로우 실행 기록 조회 성공`);
    console.log(`총 실행 기록 개수: ${runs.total_count}`);
    console.log(`실행 기록 배열 길이: ${runs.workflow_runs?.length || 0}`);

    if (runs.workflow_runs && runs.workflow_runs.length > 0) {
      console.log("\n실행 기록 목록:");
      runs.workflow_runs.forEach((run: any) => {
        console.log(`  - #${run.run_number}: ${run.name} (${run.status}/${run.conclusion || "진행 중"})`);
      });

      console.log("\n=== 3단계: 데이터 구조 확인 ===\n");
      console.log("첫 번째 실행 기록 구조:");
      console.log(JSON.stringify(runs.workflow_runs[0], null, 2));
    } else {
      console.log("\n⚠️ 실행 기록이 없습니다.");
    }

    console.log("\n=== 테스트 완료 ===\n");
    console.log("✅ 모든 테스트가 성공했습니다!");

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

testGitHubConnection();




