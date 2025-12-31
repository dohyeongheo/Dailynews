/**
 * GitHub 이슈 관련 함수
 */

import { getOctokitClient, getRepositoryInfo, handleRateLimitError } from "./client";
import { log } from "../utils/logger";

const { owner, repo } = getRepositoryInfo();

/**
 * 이슈 목록 조회
 */
export async function listIssues(options?: {
  state?: "open" | "closed" | "all";
  labels?: string;
  sort?: "created" | "updated" | "comments";
  direction?: "asc" | "desc";
  since?: string;
  perPage?: number;
  page?: number;
}) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: options?.state || "all",
      labels: options?.labels,
      sort: options?.sort || "created",
      direction: options?.direction || "desc",
      since: options?.since,
      per_page: options?.perPage || 30,
      page: options?.page || 1,
    });
    return response.data;
  } catch (error) {
    log.error("이슈 목록 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 이슈 상세 정보 조회
 */
export async function getIssue(issueNumber: number) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });
    return response.data;
  } catch (error) {
    log.error("이슈 상세 정보 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 이슈 생성
 */
export async function createIssue(options: {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.issues.create({
      owner,
      repo,
      title: options.title,
      body: options.body,
      labels: options.labels,
      assignees: options.assignees,
      milestone: options.milestone,
    });
    return response.data;
  } catch (error) {
    log.error("이슈 생성 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 이슈 업데이트
 */
export async function updateIssue(
  issueNumber: number,
  options: {
    title?: string;
    body?: string;
    state?: "open" | "closed";
    state_reason?: "completed" | "not_planned" | "reopened";
    labels?: string[];
    assignees?: string[];
    milestone?: number;
  }
) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...options,
    });
    return response.data;
  } catch (error) {
    log.error("이슈 업데이트 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}


