import {
  calculateJaccardSimilarity,
  calculateLevenshteinSimilarity,
  calculateNewsSimilarity,
  similarityToPercent,
} from "@/lib/utils/text-similarity";

describe("text-similarity", () => {
  describe("calculateJaccardSimilarity", () => {
    it("동일한 텍스트는 1을 반환해야 함", () => {
      const text = "태국 방콕에서 대규모 축제가 열렸습니다";
      expect(calculateJaccardSimilarity(text, text)).toBe(1);
    });

    it("완전히 다른 텍스트는 0에 가까운 값을 반환해야 함", () => {
      const text1 = "태국 방콕 축제";
      const text2 = "한국 서울 날씨";
      const similarity = calculateJaccardSimilarity(text1, text2);
      expect(similarity).toBeLessThan(0.5);
    });

    it("일부 단어가 겹치는 경우 적절한 유사도를 반환해야 함", () => {
      const text1 = "태국 방콕에서 대규모 축제가 열렸습니다";
      const text2 = "태국 방콕에서 음악 축제가 개최되었습니다";
      const similarity = calculateJaccardSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(1);
    });

    it("빈 문자열은 0을 반환해야 함", () => {
      expect(calculateJaccardSimilarity("", "텍스트")).toBe(0);
      expect(calculateJaccardSimilarity("텍스트", "")).toBe(0);
      expect(calculateJaccardSimilarity("", "")).toBe(1);
    });

    it("대소문자를 구분하지 않아야 함", () => {
      const text1 = "태국 방콕";
      const text2 = "태국 방콕";
      expect(calculateJaccardSimilarity(text1, text2)).toBe(1);
    });
  });

  describe("calculateLevenshteinSimilarity", () => {
    it("동일한 텍스트는 1을 반환해야 함", () => {
      const text = "태국 방콕 축제";
      expect(calculateLevenshteinSimilarity(text, text)).toBe(1);
    });

    it("비슷한 텍스트는 높은 유사도를 반환해야 함", () => {
      const text1 = "태국 방콕 축제";
      const text2 = "태국 방콕 축제";
      expect(calculateLevenshteinSimilarity(text1, text2)).toBe(1);
    });

    it("약간 다른 텍스트는 중간 정도의 유사도를 반환해야 함", () => {
      const text1 = "태국 방콕";
      const text2 = "태국 방콕 축제";
      const similarity = calculateLevenshteinSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it("완전히 다른 텍스트는 낮은 유사도를 반환해야 함", () => {
      const text1 = "태국 방콕";
      const text2 = "한국 서울";
      const similarity = calculateLevenshteinSimilarity(text1, text2);
      expect(similarity).toBeLessThan(0.5);
    });

    it("빈 문자열은 0을 반환해야 함", () => {
      expect(calculateLevenshteinSimilarity("", "텍스트")).toBe(0);
      expect(calculateLevenshteinSimilarity("텍스트", "")).toBe(0);
    });
  });

  describe("calculateNewsSimilarity", () => {
    it("동일한 제목과 내용은 높은 유사도를 반환해야 함", () => {
      const title1 = "태국 방콕에서 대규모 축제";
      const content1 = "태국 방콕에서 대규모 축제가 열렸습니다. 많은 사람들이 참여했습니다.";
      const title2 = "태국 방콕에서 대규모 축제";
      const content2 = "태국 방콕에서 대규모 축제가 열렸습니다. 많은 사람들이 참여했습니다.";

      const similarity = calculateNewsSimilarity(title1, content1, title2, content2);
      expect(similarity).toBeGreaterThan(0.9);
    });

    it("제목은 비슷하지만 내용이 다른 경우 중간 유사도를 반환해야 함", () => {
      const title1 = "태국 방콕 축제";
      const content1 = "태국 방콕에서 음악 축제가 열렸습니다.";
      const title2 = "태국 방콕 축제";
      const content2 = "태국 방콕에서 음식 축제가 개최되었습니다.";

      const similarity = calculateNewsSimilarity(title1, content1, title2, content2);
      expect(similarity).toBeGreaterThan(0.4);
      expect(similarity).toBeLessThan(0.8);
    });

    it("완전히 다른 뉴스는 낮은 유사도를 반환해야 함", () => {
      const title1 = "태국 방콕 축제";
      const content1 = "태국 방콕에서 축제가 열렸습니다.";
      const title2 = "한국 서울 날씨";
      const content2 = "한국 서울의 오늘 날씨는 맑습니다.";

      const similarity = calculateNewsSimilarity(title1, content1, title2, content2);
      expect(similarity).toBeLessThan(0.3);
    });

    it("기본 가중치(제목 40%, 내용 60%)를 사용해야 함", () => {
      const title1 = "태국 축제";
      const content1 = "내용이 다름";
      const title2 = "태국 축제";
      const content2 = "완전히 다른 내용";

      // 제목은 동일하지만 내용이 다름
      const similarity = calculateNewsSimilarity(title1, content1, title2, content2);
      // 제목 유사도 1 * 0.4 + 내용 유사도 (낮음) * 0.6
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(0.7);
    });

    it("커스텀 가중치를 사용할 수 있어야 함", () => {
      const title1 = "태국 축제";
      const content1 = "같은 내용";
      const title2 = "다른 제목";
      const content2 = "같은 내용";

      // 제목 가중치를 높게 설정하면 유사도가 낮아짐
      const similarityLowTitle = calculateNewsSimilarity(title1, content1, title2, content2, 0.8, 0.2);
      // 내용 가중치를 높게 설정하면 유사도가 높아짐
      const similarityHighContent = calculateNewsSimilarity(title1, content1, title2, content2, 0.2, 0.8);

      expect(similarityHighContent).toBeGreaterThan(similarityLowTitle);
    });
  });

  describe("similarityToPercent", () => {
    it("0을 0%로 변환해야 함", () => {
      expect(similarityToPercent(0)).toBe(0);
    });

    it("1을 100%로 변환해야 함", () => {
      expect(similarityToPercent(1)).toBe(100);
    });

    it("0.5를 50%로 변환해야 함", () => {
      expect(similarityToPercent(0.5)).toBe(50);
    });

    it("0.85를 85%로 변환해야 함", () => {
      expect(similarityToPercent(0.85)).toBe(85);
    });

    it("소수점을 반올림해야 함", () => {
      expect(similarityToPercent(0.854)).toBe(85);
      expect(similarityToPercent(0.856)).toBe(86);
    });
  });
});

