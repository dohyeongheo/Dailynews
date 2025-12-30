#!/usr/bin/env tsx

/**
 * GitHub 릴리즈 관련 CLI 스크립트
 */

import { listReleases, getRelease } from "../../lib/github/releases";

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
          console.error("❌ releaseId가 필요합니다.");
          console.log("사용법: npm run github:releases show <releaseId>");
          process.exit(1);
        }
        await handleShow(Number(arg));
        break;
      default:
        console.log("사용 가능한 명령어:");
        console.log("  list - 릴리즈 목록 조회");
        console.log("  show <releaseId> - 릴리즈 상세 정보");
        break;
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleList() {
  console.log("📋 릴리즈 목록 조회 중...\n");
  const releases = await listReleases({ perPage: 20 });

  releases.forEach((release) => {
    const draftIcon = release.draft ? "📝" : "";
    const prereleaseIcon = release.prerelease ? "🔖" : "";
    console.log(`${draftIcon}${prereleaseIcon} ${release.name} (${release.tag_name})`);
    console.log(`    작성자: ${release.author.login}`);
    console.log(`    생성일: ${new Date(release.created_at).toLocaleString("ko-KR")}`);
    if (release.published_at) {
      console.log(`    발행일: ${new Date(release.published_at).toLocaleString("ko-KR")}`);
    }
    console.log(`    URL: ${release.html_url}`);
    console.log("");
  });
}

async function handleShow(releaseId: number) {
  console.log(`📋 릴리즈 #${releaseId} 상세 정보 조회 중...\n`);

  const release = await getRelease(releaseId);
  const draftIcon = release.draft ? "📝" : "";
  const prereleaseIcon = release.prerelease ? "🔖" : "";

  console.log(`${draftIcon}${prereleaseIcon} ${release.name} (${release.tag_name})`);
  console.log(`작성자: ${release.author.login}`);
  console.log(`생성일: ${new Date(release.created_at).toLocaleString("ko-KR")}`);
  if (release.published_at) {
    console.log(`발행일: ${new Date(release.published_at).toLocaleString("ko-KR")}`);
  }
  console.log(`초안: ${release.draft ? "예" : "아니오"}`);
  console.log(`프리릴리즈: ${release.prerelease ? "예" : "아니오"}`);
  console.log(`\n내용:\n${release.body || "내용 없음"}`);
  console.log(`\nURL: ${release.html_url}`);
}

main();

