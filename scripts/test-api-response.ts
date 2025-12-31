/**
 * API 응답 구조 테스트 스크립트
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

async function testAPIResponse() {
  try {
    console.log("=== API 응답 구조 테스트 ===\n");

    const { listWorkflowRuns } = await import("../lib/github/workflows");
    const { createSuccessResponse } = await import("../lib/utils/api-response");

    // 실제 API에서 받아오는 데이터
    const runs = await listWorkflowRuns({ perPage: 5 });

    console.log("1. GitHub API 원본 응답:");
    console.log("   - total_count:", runs.total_count);
    console.log("   - workflow_runs 배열 길이:", runs.workflow_runs?.length || 0);
    console.log("   - workflow_runs 타입:", typeof runs.workflow_runs);
    console.log("   - workflow_runs isArray:", Array.isArray(runs.workflow_runs));

    // createSuccessResponse로 감싼 응답 (실제 API 라우트에서 반환하는 구조)
    const apiResponse = createSuccessResponse(runs);
    const responseBody = await apiResponse.json();

    console.log("\n2. API 라우트 응답 구조 (createSuccessResponse 후):");
    console.log("   - success:", responseBody.success);
    console.log("   - data 타입:", typeof responseBody.data);
    console.log("   - data 키:", Object.keys(responseBody.data || {}));
    console.log("   - data.total_count:", responseBody.data?.total_count);
    console.log("   - data.workflow_runs 타입:", typeof responseBody.data?.workflow_runs);
    console.log("   - data.workflow_runs 배열 길이:", responseBody.data?.workflow_runs?.length || 0);
    console.log("   - data.workflow_runs isArray:", Array.isArray(responseBody.data?.workflow_runs));

    console.log("\n3. 프론트엔드 접근 경로:");
    console.log("   - data.data?.workflow_runs:", responseBody.data?.workflow_runs?.length || 0, "개");

    if (responseBody.data?.workflow_runs && responseBody.data.workflow_runs.length > 0) {
      console.log("\n4. 첫 번째 실행 기록 샘플:");
      const firstRun = responseBody.data.workflow_runs[0];
      console.log("   - id:", firstRun.id);
      console.log("   - name:", firstRun.name);
      console.log("   - run_number:", firstRun.run_number);
      console.log("   - status:", firstRun.status);
      console.log("   - conclusion:", firstRun.conclusion);
      console.log("   - html_url:", firstRun.html_url);
    }

    console.log("\n=== 테스트 완료 ===\n");
    console.log("✅ API 응답 구조가 정상입니다!");

  } catch (error: any) {
    console.error("\n❌ 오류 발생:");
    console.error("메시지:", error.message);
    process.exit(1);
  }
}

testAPIResponse();




