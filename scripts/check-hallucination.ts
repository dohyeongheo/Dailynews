/**
 * 할루시네이션 뉴스 데이터 확인 스크립트
 * Supabase에서 수집된 뉴스 데이터를 분석하여 AI 할루시네이션 패턴을 찾습니다.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";

/**
 * 할루시네이션 의심 패턴 검사
 */
function checkHallucinationPatterns(title: string, content: string, sourceMedia: string): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // 1. 제목이나 내용이 비정상적으로 짧은 경우
  if (title.length < 10) {
    reasons.push("제목이 너무 짧음");
  }
  if (content.length < 100) {
    reasons.push("내용이 너무 짧음");
  }

  // 2. 제목이나 내용이 비정상적으로 긴 경우
  if (title.length > 200) {
    reasons.push("제목이 너무 김");
  }
  if (content.length > 10000) {
    reasons.push("내용이 너무 김");
  }

  // 3. 내용에 반복되는 패턴이 많은 경우 (할루시네이션 의심)
  const repeatedPhrases = content.match(/(.{10,})\1{2,}/g);
  if (repeatedPhrases && repeatedPhrases.length > 0) {
    reasons.push(`반복되는 구문 발견: ${repeatedPhrases.length}개`);
  }

  // 4. AI 생성 관련 키워드가 포함된 경우
  const aiKeywords = [
    "생성된",
    "AI가",
    "인공지능이",
    "테스트",
    "샘플",
    "예시",
    "더미",
    "fake",
    "test",
    "sample",
    "generated",
    "hallucination",
  ];
  const lowerContent = content.toLowerCase();
  const foundKeywords = aiKeywords.filter((keyword) => lowerContent.includes(keyword.toLowerCase()));
  if (foundKeywords.length > 0) {
    reasons.push(`AI 생성 관련 키워드 발견: ${foundKeywords.join(", ")}`);
  }

  // 5. 내용이 특정 패턴으로 반복되는 경우 (예: "뉴스 내용 뉴스 내용 뉴스 내용")
  const words = content.split(/\s+/);
  if (words.length > 0) {
    const wordFrequency = new Map<string, number>();
    words.forEach((word) => {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    });
    const maxFrequency = Math.max(...Array.from(wordFrequency.values()));
    const totalWords = words.length;
    if (totalWords > 0 && maxFrequency / totalWords > 0.1) {
      reasons.push("특정 단어가 비정상적으로 많이 반복됨");
    }
  }

  // 6. 내용이 문장 구조가 아닌 경우 (너무 많은 특수문자, 숫자만 등)
  const alphaNumericRatio = (content.match(/[a-zA-Z가-힣]/g) || []).length / content.length;
  if (alphaNumericRatio < 0.5 && content.length > 50) {
    reasons.push("알파벳/한글 비율이 너무 낮음");
  }

  // 7. 소스 미디어와 내용의 일관성 검사 (소스 미디어가 비어있거나 너무 짧은 경우)
  if (!sourceMedia || sourceMedia.trim().length < 2) {
    reasons.push("소스 미디어 정보가 부족함");
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

async function main() {
  try {
    log.info("할루시네이션 뉴스 데이터 확인 시작");

    // 최근 100개의 뉴스 조회
    const { data: recentNews, error: fetchError } = await supabaseServer
      .from("news")
      .select("id, title, content, source_media, source_country, category, published_date, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (fetchError) {
      log.error("뉴스 데이터 조회 실패", new Error(fetchError.message));
      process.exit(1);
    }

    if (!recentNews || recentNews.length === 0) {
      log.info("조회된 뉴스가 없습니다");
      process.exit(0);
    }

    log.info(`총 ${recentNews.length}개의 뉴스를 분석합니다`);

    // 할루시네이션 의심 뉴스 분석
    const suspiciousNews: Array<{
      id: string;
      title: string;
      content: string;
      sourceMedia: string;
      reasons: string[];
    }> = [];

    for (const news of recentNews) {
      const { isSuspicious, reasons } = checkHallucinationPatterns(
        news.title || "",
        news.content || "",
        news.source_media || ""
      );

      if (isSuspicious) {
        suspiciousNews.push({
          id: news.id,
          title: news.title || "",
          content: news.content || "",
          sourceMedia: news.source_media || "",
          reasons,
        });
      }
    }

    // 결과 출력
    console.log("\n" + "=".repeat(80));
    console.log("할루시네이션 의심 뉴스 분석 결과");
    console.log("=".repeat(80));
    console.log(`\n전체 뉴스: ${recentNews.length}개`);
    console.log(`의심 뉴스: ${suspiciousNews.length}개`);
    console.log(`정상 뉴스: ${recentNews.length - suspiciousNews.length}개`);

    if (suspiciousNews.length > 0) {
      console.log("\n의심 뉴스 상세:");
      console.log("-".repeat(80));

      suspiciousNews.forEach((news, index) => {
        console.log(`\n[${index + 1}] ID: ${news.id}`);
        console.log(`제목: ${news.title.substring(0, 100)}${news.title.length > 100 ? "..." : ""}`);
        console.log(`소스: ${news.sourceMedia}`);
        console.log(`내용 (처음 200자): ${news.content.substring(0, 200)}${news.content.length > 200 ? "..." : ""}`);
        console.log(`의심 사유:`);
        news.reasons.forEach((reason) => {
          console.log(`  - ${reason}`);
        });
        console.log("-".repeat(80));
      });
    } else {
      console.log("\n의심되는 뉴스가 없습니다.");
    }

    // 중복 제목 확인
    console.log("\n" + "=".repeat(80));
    console.log("중복 제목 분석");
    console.log("=".repeat(80));

    const titleCounts = new Map<string, number>();
    recentNews.forEach((news) => {
      const title = news.title || "";
      titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
    });

    const duplicateTitles = Array.from(titleCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    if (duplicateTitles.length > 0) {
      console.log(`\n중복 제목 발견: ${duplicateTitles.length}개`);
      duplicateTitles.slice(0, 10).forEach(([title, count]) => {
        console.log(`  - "${title.substring(0, 60)}${title.length > 60 ? "..." : ""}" (${count}회)`);
      });
    } else {
      console.log("\n중복 제목이 없습니다.");
    }

    log.info("할루시네이션 뉴스 데이터 확인 완료", {
      total: recentNews.length,
      suspicious: suspiciousNews.length,
      duplicateTitles: duplicateTitles.length,
    });
  } catch (error) {
    log.error("할루시네이션 뉴스 데이터 확인 중 오류 발생", error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

main();

