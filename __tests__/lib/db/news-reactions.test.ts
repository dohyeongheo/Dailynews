/**
 * news-reactions 모듈 테스트
 */

jest.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'new-reaction-id' }, error: null })),
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
            single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
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
      const mockSelect1 = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect1,
      });

      // upsert 성공
      const mockUpsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'new-reaction-id' }, error: null })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        upsert: mockUpsert,
      });

      const { setNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await setNewsReaction('news-123', 'user-123', 'like');

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('news_reactions');
    });

    it('같은 반응이면 삭제(토글)되어야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;

      // getUserNewsReaction이 'like'를 반환하도록 (같은 반응)
      const mockSelect1 = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: { reaction_type: 'like' }, error: null })),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect1,
      });

      // delete 성공
      const mockDelete = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        delete: mockDelete,
      });

      const { setNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await setNewsReaction('news-123', 'user-123', 'like');

      expect(result).toBe(true);
    });

    it('데이터베이스 오류 시 false를 반환해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;

      const mockSelect1 = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect1,
      });

      const mockUpsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        upsert: mockUpsert,
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
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() =>
          Promise.resolve({
            data: [
              { reaction_type: 'like' },
              { reaction_type: 'like' },
              { reaction_type: 'dislike' },
            ],
            error: null,
          })
        ),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      const { getNewsReactionCounts } = await import('@/lib/db/news-reactions');
      const result = await getNewsReactionCounts('news-123');

      expect(result.likes).toBe(2);
      expect(result.dislikes).toBe(1);
    });

    it('반응이 없으면 0을 반환해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
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
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: { reaction_type: 'like' }, error: null })),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      const { getUserNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await getUserNewsReaction('news-123', 'user-123');

      expect(result).toBe('like');
    });

    it('반응이 없으면 null을 반환해야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      const { getUserNewsReaction } = await import('@/lib/db/news-reactions');
      const result = await getUserNewsReaction('news-123', 'user-123');

      expect(result).toBeNull();
    });
  });
});

