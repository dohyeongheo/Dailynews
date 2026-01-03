/**
 * 할루시네이션 감지 로직 테스트 스크립트
 */

import { checkHallucinationPatterns } from "@/lib/utils/hallucination-detector";

// 사용자가 제공한 예시 뉴스
const testNews = {
  title: "영화 '서울 1988' 개봉 첫 주말 200만 관객 동원",
  content: `현재 수집된 뉴스 데이터 중에서 1988년 서울 올림픽을 배경으로 한 영화 '서울 1988'이 개봉 첫 주말에만 200만 명의 관객을 동원하며 새해 극장가 흥행 돌풍을 일으키고 있다. 이 영화는 격동의 시대를 살아가는 평범한 사람들의 꿈과 사랑, 우정을 따뜻한 시선으로 그려내며 전 세대의 공감을 얻고 있다. 특히 80년대의 시대상을 완벽하게 재현한 미장센과 당시의 유행가를 적재적소에 활용한 OST가 중장년층에게는 향수를, 젊은 세대에게는 새로운 재미를 선사하며 '레트로 열풍'을 이끌고 있다는 평가다. 주연 배우들의 호연과 탄탄한 시나리오가 입소문을 타면서 예매율이 가파르게 상승하고 있어, 새해 첫 '천만 영화' 탄생에 대한 기대감도 높아지고 있다. 경쟁작들의 부진 속에서 당분간 '서울 1988'의 독주가 이어질 전망이다.`,
  sourceMedia: "테스트 언론사",
};

console.log("=".repeat(80));
console.log("할루시네이션 감지 테스트");
console.log("=".repeat(80));
console.log("\n테스트 뉴스:");
console.log(`제목: ${testNews.title}`);
console.log(`내용: ${testNews.content.substring(0, 100)}...`);
console.log(`소스: ${testNews.sourceMedia}`);
console.log("\n" + "-".repeat(80));

const result = checkHallucinationPatterns(testNews.title, testNews.content, testNews.sourceMedia);

console.log("\n검사 결과:");
console.log(`의심 여부: ${result.isSuspicious ? "✅ 의심됨" : "❌ 정상"}`);
console.log(`점수: ${result.score}/100`);
console.log(`의심 사유:`);
result.reasons.forEach((reason, index) => {
  console.log(`  ${index + 1}. ${reason}`);
});

console.log("\n" + "=".repeat(80));
if (result.isSuspicious) {
  console.log("✅ 이 뉴스는 할루시네이션으로 감지되어 필터링됩니다!");
} else {
  console.log("❌ 이 뉴스는 정상으로 판단되어 통과됩니다.");
  console.log("⚠️  감지 로직을 더 강화해야 할 수 있습니다.");
}
console.log("=".repeat(80));

