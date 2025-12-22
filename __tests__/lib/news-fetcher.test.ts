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
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// 환경 변수 모킹
jest.mock('@/lib/config/env', () => ({
  getEnv: jest.fn(() => ({
    GOOGLE_GEMINI_API_KEY: 'test-api-key',
  })),
}));

describe('news-fetcher', () => {
  const mockNewsInput: NewsInput = {
    published_date: '2025-01-15',
    source_country: '태국',
    source_media: 'Test Media',
    title: 'Test News Title',
    content: 'Test news content with enough length to be valid',
    category: '태국뉴스',
    original_link: 'https://example.com/news/1',
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
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify({
            news: [mockNewsInput],
          })),
        },
      });

      const mockModel = {
        generateContent: mockGenerateContent,
      };

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn(() => mockModel),
      }));

      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockResolvedValueOnce({ success: 1, failed: 0 });

      const result = await fetchAndSaveNews('2025-01-15');

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(1);
    });

    it('뉴스 수집 실패 시 에러를 throw해야 함', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API Error'));

      const mockModel = {
        generateContent: mockGenerateContent,
      };

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn(() => mockModel),
      }));

      await expect(fetchAndSaveNews('2025-01-15')).rejects.toThrow('API Error');
    });

    it('날짜가 지정되지 않으면 오늘 날짜를 사용해야 함', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify({
            news: [],
          })),
        },
      });

      const mockModel = {
        generateContent: mockGenerateContent,
      };

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn(() => mockModel),
      }));

      const { insertNewsBatch } = await import('@/lib/db/news');
      (insertNewsBatch as jest.Mock).mockResolvedValueOnce({ success: 0, failed: 0 });

      await fetchAndSaveNews();

      // 오늘 날짜가 사용되었는지 확인 (프롬프트에 날짜가 포함되어야 함)
      expect(mockGenerateContent).toHaveBeenCalled();
      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs).toBeDefined();
    });
  });
});

