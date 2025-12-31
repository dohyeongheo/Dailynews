#!/usr/bin/env tsx

/**
 * GitHub 이슈 관련 CLI 스크립트
 */

import { listIssues, createIssue, getIssue } from "../../lib/github/issues";

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case "list":
        await handleList();
        break;
      case "create":
        await handleCreate();
        break;
      case "show":
        const issueNumber = process.argv[3];
        if (!issueNumber) {
          console.error("❌ issueNumber가 필요합니다.");
          console.log("사용법: npm run github:issues show <issueNumber>");
          process.exit(1);
        }
        await handleShow(Number(issueNumber));
        break;
      default:
        console.log("사용 가능한 명령어:");
        console.log("  list - 이슈 목록 조회");
        console.log("  create - 이슈 생성 (대화형)");
        console.log("  show <issueNumber> - 이슈 상세 정보");
        break;
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleList() {
  console.log("📋 이슈 목록 조회 중...\n");
  const issues = await listIssues({ state: "all", perPage: 20 });

  issues.forEach((issue) => {
    const stateIcon = issue.state === "open" ? "🟢" : "🔴";
    console.log(`${stateIcon} #${issue.number} ${issue.title}`);
    console.log(`    상태: ${issue.state}`);
    console.log(`    작성자: ${issue.user?.login || "알 수 없음"}`);
    console.log(`    생성일: ${new Date(issue.created_at).toLocaleString("ko-KR")}`);
    if (issue.labels && issue.labels.length > 0) {
      console.log(`    라벨: ${issue.labels.map((l: any) => l.name).join(", ")}`);
    }
    console.log(`    URL: ${issue.html_url}`);
    console.log("");
  });
}

async function handleCreate() {
  console.log("📝 새 이슈 생성\n");

  // 간단한 예제 (실제로는 readline 등을 사용하여 대화형으로 만들 수 있음)
  const title = process.argv[3] || "새 이슈";
  const body = process.argv[4] || "이슈 내용을 입력하세요.";

  console.log(`제목: ${title}`);
  console.log(`내용: ${body}\n`);

  const issue = await createIssue({
    title,
    body,
    labels: ["auto-generated"],
  });

  console.log(`✅ 이슈가 생성되었습니다!`);
  console.log(`   번호: #${issue.number}`);
  console.log(`   URL: ${issue.html_url}`);
}

async function handleShow(issueNumber: number) {
  console.log(`📋 이슈 #${issueNumber} 상세 정보 조회 중...\n`);

  const issue = await getIssue(issueNumber);
  const stateIcon = issue.state === "open" ? "🟢" : "🔴";

  console.log(`${stateIcon} #${issue.number} ${issue.title}`);
  console.log(`상태: ${issue.state}`);
  console.log(`작성자: ${issue.user?.login || "알 수 없음"}`);
  console.log(`생성일: ${new Date(issue.created_at).toLocaleString("ko-KR")}`);
  console.log(`업데이트: ${new Date(issue.updated_at).toLocaleString("ko-KR")}`);
  if (issue.labels && issue.labels.length > 0) {
    console.log(`라벨: ${issue.labels.map((l: any) => l.name).join(", ")}`);
  }
  console.log(`\n내용:\n${issue.body || "내용 없음"}`);
  console.log(`\nURL: ${issue.html_url}`);
}

main();





