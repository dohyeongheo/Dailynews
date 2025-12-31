/**
 * GitHub 릴리즈 관련 함수
 */

import { getOctokitClient, getRepositoryInfo, handleRateLimitError } from "./client";
import { log } from "../utils/logger";

const { owner, repo } = getRepositoryInfo();

/**
 * 릴리즈 목록 조회
 */
export async function listReleases(options?: {
  perPage?: number;
  page?: number;
}) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: options?.perPage || 30,
      page: options?.page || 1,
    });
    return response.data;
  } catch (error) {
    log.error("릴리즈 목록 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 릴리즈 상세 정보 조회
 */
export async function getRelease(releaseId: number) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.repos.getRelease({
      owner,
      repo,
      release_id: releaseId,
    });
    return response.data;
  } catch (error) {
    log.error("릴리즈 상세 정보 조회 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}

/**
 * 릴리즈 생성
 */
export async function createRelease(options: {
  tagName: string;
  name: string;
  body: string;
  draft?: boolean;
  prerelease?: boolean;
  targetCommitish?: string;
}) {
  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.repos.createRelease({
      owner,
      repo,
      tag_name: options.tagName,
      name: options.name,
      body: options.body,
      draft: options.draft || false,
      prerelease: options.prerelease || false,
      target_commitish: options.targetCommitish,
    });
    return response.data;
  } catch (error) {
    log.error("릴리즈 생성 실패", error);
    throw new Error(handleRateLimitError(error));
  }
}





