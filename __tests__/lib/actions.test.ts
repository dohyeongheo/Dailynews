/**
 * actions 모듈 테스트 (Server Actions)
 */

import { ErrorType } from '@/lib/errors';

// news-fetcher 모킹
jest.mock('@/lib/news-fetcher', () => ({
  fetchAndSaveNews: jest.fn(),
}));

// DB 모듈 모킹
jest.mock('@/lib/db/news', () => ({
  getNewsByCategory: jest.fn(),
  getAllNews: jest.fn(),
  getNewsById: jest.fn(),
  searchNews: jest.fn(),
}));

// 에러 핸들링 모킹
jest.mock('@/lib/errors', () => ({
  ...jest.requireActual('@/lib/errors'),
  toAppError: jest.fn(),
  getErrorMessage: jest.fn(),
}));

describe('actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAndSaveNewsAction', () => {
    it('뉴스 수집 및 저장에 성공해야 함', async () => {
      const { fetchAndSaveNews } = await import('@/lib/news-fetcher');
      (fetchAndSaveNews as jest.Mock).mockResolvedValueOnce({
        success: 10,
        failed: 0,
        total: 10,
      });

      const { fetchAndSaveNewsAction } = await import('@/lib/actions');
      const result = await fetchAndSaveNewsAction('2025-01-15');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        success: 10,
        failed: 0,
        total: 10,
      });
      expect(result.message).toContain('10개의 뉴스 중 10개가 성공적으로 저장되었습니다.');
    });

    it('일부 뉴스 저장 실패 시 적절한 메시지를 반환해야 함', async () => {
      const { fetchAndSaveNews } = await import('@/lib/news-fetcher');
      (fetchAndSaveNews as jest.Mock).mockResolvedValueOnce({
        success: 8,
        failed: 2,
        total: 10,
      });

      const { fetchAndSaveNewsAction } = await import('@/lib/actions');
      const result = await fetchAndSaveNewsAction();

      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      if (result.data) {
        expect(result.data.success).toBe(8);
        expect(result.data.failed).toBe(2);
      }
    });

    it('뉴스 수집 실패 시 에러 메시지를 반환해야 함', async () => {
      const { fetchAndSaveNews } = await import('@/lib/news-fetcher');
      const { toAppError, getErrorMessage } = await import('@/lib/errors');
      const mockError = new Error('API Error');

      (fetchAndSaveNews as jest.Mock).mockRejectedValueOnce(mockError);
      (toAppError as jest.Mock).mockReturnValueOnce({
        type: ErrorType.API_ERROR,
        message: 'API Error',
      });
      (getErrorMessage as jest.Mock).mockReturnValueOnce('API 요청 중 오류가 발생했습니다.');

      const { fetchAndSaveNewsAction } = await import('@/lib/actions');
      const result = await fetchAndSaveNewsAction();

      expect(result.success).toBe(false);
      expect(result.message).toBe('API 요청 중 오류가 발생했습니다.');
      expect(result.data).toBeNull();
    });
  });

  describe('getNewsByCategoryAction', () => {
    it('카테고리별 뉴스 조회에 성공해야 함', async () => {
      const mockNews = [
        {
          id: '1',
          title: 'Test News 1',
          category: '태국뉴스',
          content: 'Content 1',
          published_date: '2025-01-15',
          source_country: '태국',
          source_media: 'Test Media',
          created_at: '2025-01-15T00:00:00Z',
        },
      ];

      const { getNewsByCategory } = await import('@/lib/db/news');
      (getNewsByCategory as jest.Mock).mockResolvedValueOnce(mockNews);

      const { getNewsByCategoryAction } = await import('@/lib/actions');
      const result = await getNewsByCategoryAction('태국뉴스', 10, 0);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNews);
      expect(result.error).toBeUndefined();
    });

    it('데이터베이스 오류 시 에러 메시지를 반환해야 함', async () => {
      const { getNewsByCategory } = await import('@/lib/db/news');
      const { toAppError, getErrorMessage } = await import('@/lib/errors');
      const mockError = new Error('Database error');

      (getNewsByCategory as jest.Mock).mockRejectedValueOnce(mockError);
      (toAppError as jest.Mock).mockReturnValueOnce({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database error',
      });
      (getErrorMessage as jest.Mock).mockReturnValueOnce('데이터베이스 오류가 발생했습니다.');

      const { getNewsByCategoryAction } = await import('@/lib/actions');
      const result = await getNewsByCategoryAction('태국뉴스');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('데이터베이스 오류가 발생했습니다.');
    });
  });

  describe('getAllNewsAction', () => {
    it('모든 뉴스 조회에 성공해야 함', async () => {
      const mockNews = [
        {
          id: '1',
          title: 'Test News 1',
          category: '태국뉴스',
        },
      ];

      const { getAllNews } = await import('@/lib/db/news');
      (getAllNews as jest.Mock).mockResolvedValueOnce(mockNews);

      const { getAllNewsAction } = await import('@/lib/actions');
      const result = await getAllNewsAction(30);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNews);
    });
  });
});

