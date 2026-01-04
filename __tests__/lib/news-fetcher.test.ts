/**
 * news-fetcher 모듈 테스트
 */

import { fetchAndSaveNews, saveNewsToDatabase } from '@/lib/news-fetcher';
import type { NewsInput } from '@/types/news';

// Google Generative AI 모킹
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn(() => ({
        generateContent: jest.fn(),
      })),
    })),
  };
});

// DB 모듈 모킹
jest.mock('@/lib/db/news', () => ({
  insertNewsBatch: jest.fn(),
}));

// 로거 모킹
jest.mock('@/lib/utils/logger', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// 환경 변수 모킹
jest.mock('@/lib/config/env', () => ({
  getEnv: jest.fn(() => ({
    GOOGLE_GEMINI_API_KEY: 'test-api-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  })),
}));

// Supabase 서버 모킹 (환경 변수 모킹 후에 로드되어야 함)
jest.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    from: jest.fn(),
  },
}));

// Storage 모듈 모킹 (TextDecoder 문제 방지)
jest.mock('@/lib/storage/image-storage', () => ({
  uploadNewsImage: jest.fn(),
  deleteNewsImage: jest.fn(),
}));

// gemini-client 모킹
jest.mock('@/lib/utils/gemini-client', () => {
  const mockGenerateContentResult = {
    response: {
      text: jest.fn(),
    },
  };

  return {
    getModelForTask: jest.fn(() => ({
      model: 'gemini-2.5-pro',
      generateContent: jest.fn(),
    })),
    generateContentWithCaching: jest.fn(),
  };
});

// metrics-storage 모킹
jest.mock('@/lib/utils/metrics-storage', () => ({
  saveMetricSnapshot: jest.fn(),
}));

// hallucination-detector 모킹
jest.mock('@/lib/utils/hallucination-detector', () => ({
  isHallucinatedNews: jest.fn(() => false), // 테스트에서는 항상 false (정상 뉴스)
}));

// NewsAPI 모킹
jest.mock('@/lib/news-sources/newsapi', () => ({
  fetchThaiNewsFromNewsAPI: jest.fn(),
}));

// 네이버 API 모킹
jest.mock('@/lib/news-sources/naver-api', () => ({
  fetchKoreanNewsFromNaver: jest.fn(),
  fetchRelatedNewsFromNaver: jest.fn(),
}));

// image-fetcher 모킹
jest.mock('@/lib/image-generator/image-fetcher', () => ({
  fetchOrGenerateImage: jest.fn(),
}));

// date-helper 모킹 (오늘 날짜 고정)
jest.mock('@/lib/utils/date-helper', () => {
  const mockToday = '2025-01-15';
  return {
    getTodayKST: jest.fn(() => mockToday),
    isPastDate: jest.fn((date: string) => {
      return date < mockToday;
    }),
    isFutureDate: jest.fn((date: string) => {
      return date > mockToday;
    }),
  };
});

describe('news-fetcher', () => {
  // 오늘 날짜를 사용 (검증 로직 통과)
  const mockToday = '2025-01-15';
  const mockNewsInput: NewsInput = {
    published_date: mockToday,
    source_country: '태국',
    source_media: 'Test Media',
    title: 'Test News Title',
    content: 'Test news content with enough length to be valid'.repeat(10), // 최소 길이 요구사항 충족
    category: '태국뉴스',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveNewsToDatabase', () => {
    it('뉴스 저장에 성공해야 함', async () => {
      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockResolvedValueOnce({ success: 2, failed: 0 });

      const result = await saveNewsToDatabase([mockNewsInput, { ...mockNewsInput, title: 'Test 2' }]);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(insertNewsBatch).toHaveBeenCalledTimes(1);
    });

    it('일부 뉴스 저장 실패 시 failed 수를 올바르게 반환해야 함', async () => {
      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockResolvedValueOnce({ success: 1, failed: 1 });

      const result = await saveNewsToDatabase([mockNewsInput, { ...mockNewsInput, title: 'Test 2' }]);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('빈 배열 전달 시 0을 반환해야 함', async () => {
      const result = await saveNewsToDatabase([]);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('데이터베이스 오류 시 모든 뉴스를 실패로 처리해야 함', async () => {
      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const result = await saveNewsToDatabase([mockNewsInput]);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe('fetchAndSaveNews', () => {
    it('뉴스 수집 및 저장에 성공해야 함', async () => {
      const { fetchThaiNewsFromNewsAPI } = await import('@/lib/news-sources/newsapi');
      const { fetchKoreanNewsFromNaver, fetchRelatedNewsFromNaver } = await import('@/lib/news-sources/naver-api');

      // 한국어로 번역된 태국 뉴스 (isKorean이 true를 반환하도록)
      const translatedThaiNews: NewsInput = {
        ...mockNewsInput,
        title: '테스트 뉴스 제목',
        content: '테스트 뉴스 내용입니다. 한국어로 번역된 내용입니다.'.repeat(10),
      };

      // NewsAPI와 네이버 API 모킹
      (fetchThaiNewsFromNewsAPI as jest.Mock).mockResolvedValueOnce([translatedThaiNews]);
      (fetchKoreanNewsFromNaver as jest.Mock).mockResolvedValueOnce([]);
      (fetchRelatedNewsFromNaver as jest.Mock).mockResolvedValueOnce([]);

      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockResolvedValueOnce({
        success: 1,
        failed: 0,
        savedNewsIds: ['test-news-id'],
      });

      const result = await fetchAndSaveNews(mockToday);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(1);
      expect(fetchThaiNewsFromNewsAPI).toHaveBeenCalledWith(mockToday, 10);
      expect(fetchKoreanNewsFromNaver).toHaveBeenCalledWith(mockToday, 10);
      expect(fetchRelatedNewsFromNaver).toHaveBeenCalledWith(mockToday, 10);
    });

    it('뉴스 수집 실패 시 빈 배열을 반환해야 함', async () => {
      const { fetchThaiNewsFromNewsAPI } = await import('@/lib/news-sources/newsapi');
      const { fetchKoreanNewsFromNaver, fetchRelatedNewsFromNaver } = await import('@/lib/news-sources/naver-api');

      // 모든 API가 빈 배열 반환
      (fetchThaiNewsFromNewsAPI as jest.Mock).mockResolvedValueOnce([]);
      (fetchKoreanNewsFromNaver as jest.Mock).mockResolvedValueOnce([]);
      (fetchRelatedNewsFromNaver as jest.Mock).mockResolvedValueOnce([]);

      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockResolvedValueOnce({
        success: 0,
        failed: 0,
        savedNewsIds: [],
      });

      const result = await fetchAndSaveNews(mockToday);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(0);
    }, 10000); // 타임아웃 증가

    it('날짜가 지정되지 않으면 오늘 날짜를 사용해야 함', async () => {
      const { fetchThaiNewsFromNewsAPI } = await import('@/lib/news-sources/newsapi');
      const { fetchKoreanNewsFromNaver, fetchRelatedNewsFromNaver } = await import('@/lib/news-sources/naver-api');
      const { getTodayKST } = await import('@/lib/utils/date-helper');

      // 한국어로 번역된 태국 뉴스
      const translatedThaiNews: NewsInput = {
        ...mockNewsInput,
        title: '테스트 뉴스 제목',
        content: '테스트 뉴스 내용입니다. 한국어로 번역된 내용입니다.'.repeat(10),
      };

      // NewsAPI와 네이버 API 모킹
      (fetchThaiNewsFromNewsAPI as jest.Mock).mockResolvedValueOnce([translatedThaiNews]);
      (fetchKoreanNewsFromNaver as jest.Mock).mockResolvedValueOnce([]);
      (fetchRelatedNewsFromNaver as jest.Mock).mockResolvedValueOnce([]);

      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockResolvedValueOnce({
        success: 1,
        failed: 0,
        savedNewsIds: ['test-news-id'],
      });

      const result = await fetchAndSaveNews();

      // 오늘 날짜가 사용되었는지 확인
      expect(getTodayKST).toHaveBeenCalled();
      expect(result.success).toBe(1);
      expect(result.total).toBe(1);
    });
  });
});

