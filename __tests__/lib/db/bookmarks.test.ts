/**
 * bookmarks 모듈 테스트
 */

// Supabase 클라이언트 모킹
const mockFrom = jest.fn();
const mockCreateClient = jest.fn(() => ({
  from: mockFrom,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
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
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: mockBookmark,
        error: null,
      });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const mockInsert = jest.fn(() => ({ select: mockSelect }));

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });

      const { addBookmark } = await import('@/lib/db/bookmarks');
      const result = await addBookmark('user-123', 'news-123');

      expect(result).toEqual(mockBookmark);
      expect(mockFrom).toHaveBeenCalledWith('bookmarks');
      expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user-123', news_id: 'news-123' });
    });

    it('중복 북마크 시 에러를 throw해야 함', async () => {
      const mockError = { code: '23505', message: 'duplicate key' };
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: null,
        error: mockError,
      });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const mockInsert = jest.fn(() => ({ select: mockSelect }));

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });

      const { addBookmark } = await import('@/lib/db/bookmarks');

      await expect(addBookmark('user-123', 'news-123')).rejects.toEqual(mockError);
    });
  });

  describe('removeBookmark', () => {
    it('북마크 제거에 성공해야 함', async () => {
      const mockMatch = jest.fn().mockResolvedValueOnce({ error: null });
      const mockDelete = jest.fn(() => ({ match: mockMatch }));

      mockFrom.mockReturnValueOnce({
        delete: mockDelete,
      });

      const { removeBookmark } = await import('@/lib/db/bookmarks');

      await expect(removeBookmark('user-123', 'news-123')).resolves.not.toThrow();
      expect(mockMatch).toHaveBeenCalledWith({ user_id: 'user-123', news_id: 'news-123' });
    });

    it('제거 오류 시 에러를 throw해야 함', async () => {
      const mockError = { message: 'Delete failed' };
      const mockMatch = jest.fn().mockResolvedValueOnce({
        error: mockError,
      });
      const mockDelete = jest.fn(() => ({ match: mockMatch }));

      mockFrom.mockReturnValueOnce({
        delete: mockDelete,
      });

      const { removeBookmark } = await import('@/lib/db/bookmarks');

      await expect(removeBookmark('user-123', 'news-123')).rejects.toEqual(mockError);
    });
  });

  describe('getUserBookmarks', () => {
    it('사용자의 북마크 목록을 조회해야 함', async () => {
      const mockRange = jest.fn().mockResolvedValueOnce({
        data: [{ ...mockBookmark, news: mockNews }],
        error: null,
      });
      const mockOrder = jest.fn(() => ({ range: mockRange }));
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));

      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      const { getUserBookmarks } = await import('@/lib/db/bookmarks');
      const result = await getUserBookmarks('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].news).toEqual(mockNews);
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('북마크가 없으면 빈 배열을 반환해야 함', async () => {
      const mockRange = jest.fn().mockResolvedValueOnce({
        data: [],
        error: null,
      });
      const mockOrder = jest.fn(() => ({ range: mockRange }));
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));

      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      const { getUserBookmarks } = await import('@/lib/db/bookmarks');
      const result = await getUserBookmarks('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('isBookmarked', () => {
    it('북마크되어 있으면 true를 반환해야 함', async () => {
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: { id: 'bookmark-123' },
        error: null,
      });
      const mockMatch = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ match: mockMatch }));

      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      const { isBookmarked } = await import('@/lib/db/bookmarks');
      const result = await isBookmarked('user-123', 'news-123');

      expect(result).toBe(true);
      expect(mockMatch).toHaveBeenCalledWith({ user_id: 'user-123', news_id: 'news-123' });
    });

    it('북마크되어 있지 않으면 false를 반환해야 함', async () => {
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found error code
      });
      const mockMatch = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ match: mockMatch }));

      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      const { isBookmarked } = await import('@/lib/db/bookmarks');
      const result = await isBookmarked('user-123', 'news-123');

      expect(result).toBe(false);
    });
  });
});

