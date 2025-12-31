/**
 * GitHub 워크플로우 관련 함수
 */

import { getOctokitClient, getRepositoryInfo, handleRateLimitError } from "./client";
import { log } from "../utils/logger";

const { owner, repo } = getRepositoryInfo();

/**
 * 워크플로우 목록 조회
 */
export async function listWorkflows() {
  try {
    const octokit = getOctokitClient();
    log.info("워크플로우 목록 조회 시작", { owner, repo });

    const response = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
    });

    log.info("워크플로우 목록 조회 성공", {
      totalCount: response.data.total_count,
      workflowsCount: response.data.workflows?.length || 0
    });

    return response.data;
  } catch (error) {
    log.error("워크플로우 목록 조회 실패", {
      error,
      owner,
      repo,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStatus: (error as any)?.status,
      errorResponse: (error as any)?.response?.data
    });
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 워크플로우 실행 기록 조회
 */
export async function listWorkflowRuns(options?: {
  workflowId?: number;
  status?: "queued" | "in_progress" | "completed";
  conclusion?: "success" | "failure" | "cancelled" | "skipped";
  event?: "push" | "pull_request" | "schedule" | "workflow_dispatch";
  actor?: string;
  branch?: string;
  perPage?: number;
  page?: number;
}) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      workflow_id: options?.workflowId,
      status: options?.status,
      conclusion: options?.conclusion,
      event: options?.event,
      actor: options?.actor,
      branch: options?.branch,
      per_page: options?.perPage || 30,
      page: options?.page || 1,
    });
    return response.data;
  } catch (error) {
    log.error("워크플로우 실행 기록 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 특정 워크플로우 실행 상세 정보 조회
 */
export async function getWorkflowRun(runId: number) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });
    return response.data;
  } catch (error) {
    log.error("워크플로우 실행 상세 정보 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 워크플로우 실행의 작업(Job) 목록 조회
 */
export async function listWorkflowRunJobs(runId: number) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });
    return response.data;
  } catch (error) {
    log.error("워크플로우 실행 작업 목록 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 워크플로우 실행 취소
 */
export async function cancelWorkflowRun(runId: number) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.actions.cancelWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });
    return response.data;
  } catch (error) {
    log.error("워크플로우 실행 취소 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 워크플로우 실행 재실행
 */
export async function rerunWorkflowRun(runId: number) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.actions.reRunWorkflow({
      owner,
      repo,
      run_id: runId,
    });
    return response.data;
  } catch (error) {
    log.error("워크플로우 실행 재실행 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 워크플로우 로그 다운로드 URL 조회
 */
export async function getWorkflowRunLogsUrl(runId: number): Promise<string | null> {
  try {
    const run = await getWorkflowRun(runId);
    return run.logs_url || null;
  } catch (error) {
    log.error("워크플로우 로그 URL 조회 실패", error);
    return null;
  }
}

/**
 * 워크플로우 실행 (workflow_dispatch)
 */
export async function createWorkflowDispatch(
  workflowId: number | string,
  ref: string = "main",
  inputs?: Record<string, string>
) {
  try {
    const octokit = getOctokitClient();
    log.info("워크플로우 실행 시작", { workflowId, ref, inputs });

    const response = await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs,
    });

    log.info("워크플로우 실행 성공", { workflowId, ref });
    return response;
  } catch (error) {
    log.error("워크플로우 실행 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

