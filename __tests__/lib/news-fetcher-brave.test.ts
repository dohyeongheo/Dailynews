/**
 * news-fetcher-brave 모듈 테스트
 */

import { fetchNewsFromBrave } from '@/lib/news-fetcher-brave';
import type { NewsInput } from '@/types/news';

// fetch 모킹
global.fetch = jest.fn();

// 로거 모킹
jest.mock('@/lib/utils/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// translateToKorean 모킹
jest.mock('@/lib/news-fetcher', () => ({
  translateToKorean: jest.fn((text: string) => Promise.resolve(text)),
}));

// 환경 변수 모킹
jest.mock('@/lib/config/env', () => ({
  getEnv: jest.fn(() => ({
    BRAVE_SEARCH_API_KEY: 'test-brave-api-key',
    NEWS_COLLECTION_METHOD: 'brave',
  })),
}));

describe('news-fetcher-brave', () => {
  const mockBraveResponse = {
    query: {
      original: '태국 뉴스',
    },
    web: {
      results: [
        {
          title: 'Test News Title 1',
          url: 'https://example.com/news/1',
          description: 'Test news description with enough content to be valid for news collection',
          meta_url: {
            hostname: 'example.com',
          },
          age: '2025-01-15',
        },
        {
          title: 'Test News Title 2',
          url: 'https://example.com/news/2',
          description: 'Another test news description',
          meta_url: {
            hostname: 'example2.com',
          },
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('fetchNewsFromBrave', () => {
    it('뉴스 수집에 성공해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBraveResponse,
      });

      const result = await fetchNewsFromBrave('2025-01-15');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('API 키가 없으면 에러를 throw해야 함', async () => {
      const { getEnv } = await import('@/lib/config/env');
      (getEnv as jest.Mock).mockReturnValueOnce({
        BRAVE_SEARCH_API_KEY: undefined,
      });

      await expect(fetchNewsFromBrave('2025-01-15')).rejects.toThrow('BRAVE_SEARCH_API_KEY가 설정되지 않았습니다');
    });

    it('API 오류 시 에러를 throw해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error message',
      });

      await expect(fetchNewsFromBrave('2025-01-15')).rejects.toThrow();
    });

    it('날짜가 지정되지 않으면 오늘 날짜를 사용해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ web: { results: [] } }),
      });

      await fetchNewsFromBrave();

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('api.search.brave.com');
    });

    it('미래 날짜는 오늘 날짜로 변경해야 함', async () => {
      const futureDate = '2099-12-31';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ web: { results: [] } }),
      });

      await fetchNewsFromBrave(futureDate);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('각 카테고리별로 뉴스를 수집해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          web: {
            results: Array(10).fill(null).map((_, i) => ({
              title: `News ${i + 1}`,
              url: `https://example.com/news/${i + 1}`,
              description: `Description ${i + 1}`,
              meta_url: { hostname: 'example.com' },
            })),
          },
        }),
      });

      const result = await fetchNewsFromBrave('2025-01-15');

      // 태국뉴스, 관련뉴스, 한국뉴스 각각 10개씩 = 총 30개
      expect(result.length).toBe(30);
      
      // 카테고리별로 분류 확인
      const categories = result.map(item => item.category);
      expect(categories.filter(c => c === '태국뉴스').length).toBe(10);
      expect(categories.filter(c => c === '관련뉴스').length).toBe(10);
      expect(categories.filter(c => c === '한국뉴스').length).toBe(10);
    });

    it('뉴스 항목이 NewsInput 형식이어야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBraveResponse,
      });

      const result = await fetchNewsFromBrave('2025-01-15');

      expect(result.length).toBeGreaterThan(0);
      const newsItem = result[0];
      expect(newsItem).toHaveProperty('title');
      expect(newsItem).toHaveProperty('content');
      expect(newsItem).toHaveProperty('category');
      expect(newsItem).toHaveProperty('source_country');
      expect(newsItem).toHaveProperty('source_media');
      expect(newsItem).toHaveProperty('published_date');
    });
  });
});

