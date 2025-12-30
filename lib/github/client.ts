/**
 * GitHub REST API 클라이언트 초기화 및 공통 함수
 */

import { Octokit } from "@octokit/rest";

/**
 * GitHub Personal Access Token
 * 환경 변수에서 가져오거나 기본값 사용
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

/**
 * GitHub 리포지토리 정보
 */
const GITHUB_OWNER = process.env.GITHUB_OWNER || "dohyeongheo";
const GITHUB_REPO = process.env.GITHUB_REPO || "Dailynews";

/**
 * Octokit 클라이언트 인스턴스
 */
let octokitInstance: Octokit | null = null;

/**
 * Octokit 클라이언트 초기화
 */
export function getOctokitClient(): Octokit {
  if (!GITHUB_TOKEN) {
    throw new Error(
      "GITHUB_TOKEN 또는 GITHUB_PERSONAL_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다."
    );
  }

  if (!octokitInstance) {
    octokitInstance = new Octokit({
      auth: GITHUB_TOKEN,
    });
  }

  return octokitInstance;
}

/**
 * GitHub 리포지토리 정보 반환
 */
export function getRepositoryInfo() {
  return {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  };
}

/**
 * API Rate Limit 처리
 * Rate Limit 초과 시 에러 메시지 반환
 */
export function handleRateLimitError(error: unknown): string {
  if (error && typeof error === "object" && "status" in error) {
    if (error.status === 403) {
      return "GitHub API Rate Limit이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    }
  }
  return "GitHub API 요청 중 오류가 발생했습니다.";
}

