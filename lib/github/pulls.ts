/**
 * GitHub Pull Request 관련 함수
 */

import { getOctokitClient, getRepositoryInfo, handleRateLimitError } from "./client";
import { log } from "../utils/logger";

const { owner, repo } = getRepositoryInfo();

/**
 * Pull Request 목록 조회
 */
export async function listPullRequests(options?: {
  state?: "open" | "closed" | "all";
  head?: string;
  base?: string;
  sort?: "created" | "updated" | "popularity" | "long-running";
  direction?: "asc" | "desc";
  perPage?: number;
  page?: number;
}) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.pulls.list({
      owner,
      repo,
      state: options?.state || "all",
      head: options?.head,
      base: options?.base,
      sort: options?.sort || "created",
      direction: options?.direction || "desc",
      per_page: options?.perPage || 30,
      page: options?.page || 1,
    });
    return response.data;
  } catch (error) {
    log.error("Pull Request 목록 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * Pull Request 상세 정보 조회
 */
export async function getPullRequest(prNumber: number) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    return response.data;
  } catch (error) {
    log.error("Pull Request 상세 정보 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * Pull Request 생성
 */
export async function createPullRequest(options: {
  title: string;
  head: string;
  base: string;
  body?: string;
  draft?: boolean;
}) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title: options.title,
      head: options.head,
      base: options.base,
      body: options.body,
      draft: options.draft || false,
    });
    return response.data;
  } catch (error) {
    log.error("Pull Request 생성 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * Pull Request 머지
 */
export async function mergePullRequest(
  prNumber: number,
  options?: {
    commit_title?: string;
    commit_message?: string;
    merge_method?: "merge" | "squash" | "rebase";
  }
) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      commit_title: options?.commit_title,
      commit_message: options?.commit_message,
      merge_method: options?.merge_method || "merge",
    });
    return response.data;
  } catch (error) {
    log.error("Pull Request 머지 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}


