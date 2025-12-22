/**
 * bookmarks 모듈 테스트
 */

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          single: jest.fn(),
        })),
        match: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      delete: jest.fn(() => ({
        match: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

describe('bookmarks', () => {
  const mockBookmark = {
    id: 'bookmark-123',
    user_id: 'user-123',
    news_id: 'news-123',
    created_at: '2025-01-15T00:00:00Z',
  };

  const mockNews = {
    id: 'news-123',
    title: 'Test News',
    content: 'Test content',
    category: '태국뉴스',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addBookmark', () => {
    it('북마크 추가에 성공해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().insert().select().single.mockResolvedValueOnce({
        data: mockBookmark,
        error: null,
      });

      const { addBookmark } = await import('@/lib/db/bookmarks');
      const result = await addBookmark('user-123', 'news-123');

      expect(result).toEqual(mockBookmark);
      expect(mockFrom).toHaveBeenCalledWith('bookmarks');
    });

    it('중복 북마크 시 에러를 throw해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key' }, // PostgreSQL unique violation
      });

      const { addBookmark } = await import('@/lib/db/bookmarks');

      await expect(addBookmark('user-123', 'news-123')).rejects.toEqual({
        code: '23505',
        message: 'duplicate key',
      });
    });
  });

  describe('removeBookmark', () => {
    it('북마크 제거에 성공해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().delete().match.mockResolvedValueOnce({ error: null });

      const { removeBookmark } = await import('@/lib/db/bookmarks');

      await expect(removeBookmark('user-123', 'news-123')).resolves.not.toThrow();
    });

    it('제거 오류 시 에러를 throw해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().delete().match.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      const { removeBookmark } = await import('@/lib/db/bookmarks');

      await expect(removeBookmark('user-123', 'news-123')).rejects.toEqual({
        message: 'Delete failed',
      });
    });
  });

  describe('getUserBookmarks', () => {
    it('사용자의 북마크 목록을 조회해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().select().eq().order().range.mockResolvedValueOnce({
        data: [{ ...mockBookmark, news: mockNews }],
        error: null,
      });

      const { getUserBookmarks } = await import('@/lib/db/bookmarks');
      const result = await getUserBookmarks('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].news).toEqual(mockNews);
    });

    it('북마크가 없으면 빈 배열을 반환해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().select().eq().order().range.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { getUserBookmarks } = await import('@/lib/db/bookmarks');
      const result = await getUserBookmarks('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('isBookmarked', () => {
    it('북마크되어 있으면 true를 반환해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().select().match().single.mockResolvedValueOnce({
        data: { id: 'bookmark-123' },
        error: null,
      });

      const { isBookmarked } = await import('@/lib/db/bookmarks');
      const result = await isBookmarked('user-123', 'news-123');

      expect(result).toBe(true);
    });

    it('북마크되어 있지 않으면 false를 반환해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().select().match().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found error code
      });

      const { isBookmarked } = await import('@/lib/db/bookmarks');
      const result = await isBookmarked('user-123', 'news-123');

      expect(result).toBe(false);
    });
  });
});

