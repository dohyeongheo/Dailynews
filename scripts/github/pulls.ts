#!/usr/bin/env tsx

/**
 * GitHub Pull Request 관련 CLI 스크립트
 */

import { listPullRequests, getPullRequest } from "../../lib/github/pulls";

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
          console.error("❌ prNumber가 필요합니다.");
          console.log("사용법: npm run github:pulls show <prNumber>");
          process.exit(1);
        }
        await handleShow(Number(arg));
        break;
      default:
        console.log("사용 가능한 명령어:");
        console.log("  list - Pull Request 목록 조회");
        console.log("  show <prNumber> - Pull Request 상세 정보");
        break;
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleList() {
  console.log("📋 Pull Request 목록 조회 중...\n");
  const pulls = await listPullRequests({ state: "all", perPage: 20 });

  pulls.forEach((pr) => {
    const stateIcon = pr.state === "open" ? "🟢" : pr.merged ? "🟣" : "🔴";
    console.log(`${stateIcon} #${pr.number} ${pr.title}`);
    console.log(`    상태: ${pr.merged ? "머지됨" : pr.state}`);
    console.log(`    브랜치: ${pr.head.ref} → ${pr.base.ref}`);
    console.log(`    작성자: ${pr.user?.login || "알 수 없음"}`);
    console.log(`    생성일: ${new Date(pr.created_at).toLocaleString("ko-KR")}`);
    console.log(`    URL: ${pr.html_url}`);
    console.log("");
  });
}

async function handleShow(prNumber: number) {
  console.log(`📋 Pull Request #${prNumber} 상세 정보 조회 중...\n`);

  const pr = await getPullRequest(prNumber);
  const stateIcon = pr.state === "open" ? "🟢" : pr.merged ? "🟣" : "🔴";

  console.log(`${stateIcon} #${pr.number} ${pr.title}`);
  console.log(`상태: ${pr.merged ? "머지됨" : pr.state}`);
  console.log(`브랜치: ${pr.head.ref} → ${pr.base.ref}`);
  console.log(`작성자: ${pr.user?.login || "알 수 없음"}`);
  console.log(`생성일: ${new Date(pr.created_at).toLocaleString("ko-KR")}`);
  console.log(`업데이트: ${new Date(pr.updated_at).toLocaleString("ko-KR")}`);
  console.log(`머지 가능: ${pr.mergeable ? "예" : "아니오"}`);
  console.log(`\n내용:\n${pr.body || "내용 없음"}`);
  console.log(`\nURL: ${pr.html_url}`);
}

main();





