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
      const { generateContentWithCaching } = await import('@/lib/utils/gemini-client');
      
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify({
            news: [mockNewsInput],
          })),
        },
      };

      (generateContentWithCaching as jest.Mock).mockResolvedValue(mockResponse);

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
      expect(generateContentWithCaching).toHaveBeenCalled();
    });

    it('뉴스 수집 실패 시 에러를 throw해야 함', async () => {
      const { generateContentWithCaching } = await import('@/lib/utils/gemini-client');
      
      (generateContentWithCaching as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(fetchAndSaveNews(mockToday)).rejects.toThrow('Failed to fetch news');
    });

    it('날짜가 지정되지 않으면 오늘 날짜를 사용해야 함', async () => {
      const { generateContentWithCaching } = await import('@/lib/utils/gemini-client');
      const { getTodayKST } = await import('@/lib/utils/date-helper');
      
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify({
            news: [mockNewsInput],
          })),
        },
      };

      (generateContentWithCaching as jest.Mock).mockResolvedValue(mockResponse);

      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockResolvedValueOnce({ 
        success: 1, 
        failed: 0,
        savedNewsIds: ['test-news-id'],
      });

      const result = await fetchAndSaveNews();

      // 오늘 날짜가 사용되었는지 확인
      expect(generateContentWithCaching).toHaveBeenCalled();
      expect(getTodayKST).toHaveBeenCalled();
      expect(result.success).toBe(1);
      expect(result.total).toBe(1);
    });
  });
});

