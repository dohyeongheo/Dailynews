/**
 * news-reactions 모듈 테스트
 */

jest.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('news-reactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setNewsReaction', () => {
    it('뉴스 반응 설정에 성공해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;

      // getUserNewsReaction이 null을 반환하도록 (새 반응)
      mockFrom().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // upsert 성공
      mockFrom().upsert().select().single.mockResolvedValueOnce({ error: null });

      const { setNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await setNewsReaction('news-123', 'user-123', 'like');

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('news_reactions');
    });

    it('같은 반응이면 삭제(토글)되어야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;

      // getUserNewsReaction이 'like'를 반환하도록 (같은 반응)
      mockFrom().select().eq().eq().single.mockResolvedValueOnce({
        data: { reaction_type: 'like' },
        error: null,
      });

      // delete 성공
      mockFrom().delete().eq().eq.mockResolvedValueOnce({ error: null });

      const { setNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await setNewsReaction('news-123', 'user-123', 'like');

      expect(result).toBe(true);
    });

    it('데이터베이스 오류 시 false를 반환해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;

      mockFrom().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockFrom().upsert().select().single.mockResolvedValueOnce({
        error: { message: 'Database error' },
      });

      const { setNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await setNewsReaction('news-123', 'user-123', 'like');

      expect(result).toBe(false);
    });
  });

  describe('getNewsReactionCounts', () => {
    it('뉴스 반응 개수를 조회해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;
      mockFrom().select().eq.mockResolvedValueOnce({
        data: [
          { reaction_type: 'like' },
          { reaction_type: 'like' },
          { reaction_type: 'dislike' },
        ],
        error: null,
      });

      const { getNewsReactionCounts } = await import('@/lib/db/news-reactions');
      const result = await getNewsReactionCounts('news-123');

      expect(result.likes).toBe(2);
      expect(result.dislikes).toBe(1);
    });

    it('반응이 없으면 0을 반환해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;
      mockFrom().select().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { getNewsReactionCounts } = await import('@/lib/db/news-reactions');
      const result = await getNewsReactionCounts('news-123');

      expect(result.likes).toBe(0);
      expect(result.dislikes).toBe(0);
    });
  });

  describe('getUserNewsReaction', () => {
    it('사용자의 뉴스 반응을 조회해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;
      mockFrom().select().eq().eq().single.mockResolvedValueOnce({
        data: { reaction_type: 'like' },
        error: null,
      });

      const { getUserNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await getUserNewsReaction('news-123', 'user-123');

      expect(result).toBe('like');
    });

    it('반응이 없으면 null을 반환해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;
      mockFrom().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found error code
      });

      const { getUserNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await getUserNewsReaction('news-123', 'user-123');

      expect(result).toBeNull();
    });
  });
});

