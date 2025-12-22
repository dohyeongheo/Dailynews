/**
 * views 모듈 테스트
 */

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    rpc: jest.fn(() => Promise.resolve({ data: 1, error: null })),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

describe('views', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('incrementViewCount', () => {
    it('조회수 증가에 성공해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockRpc = mockClient.rpc as jest.Mock;
      mockRpc.mockResolvedValueOnce({ data: 5, error: null });

      const { incrementViewCount } = await import('@/lib/db/views');
      const result = await incrementViewCount('news-123');

      expect(result).toBe(5);
      expect(mockRpc).toHaveBeenCalledWith('increment_view_count', { p_news_id: 'news-123' });
    });

    it('데이터베이스 오류 시 0을 반환해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockRpc = mockClient.rpc as jest.Mock;
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const { incrementViewCount } = await import('@/lib/db/views');
      const result = await incrementViewCount('news-123');

      expect(result).toBe(0);
    });
  });

  describe('getViewCount', () => {
    it('조회수를 조회해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().select().eq().single.mockResolvedValueOnce({
        data: { view_count: 10 },
        error: null,
      });

      const { getViewCount } = await import('@/lib/db/views');
      const result = await getViewCount('news-123');

      expect(result).toBe(10);
    });

    it('조회수가 없으면 0을 반환해야 함', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      mockFrom().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found error code
      });

      const { getViewCount } = await import('@/lib/db/views');
      const result = await getViewCount('news-123');

      expect(result).toBe(0);
    });
  });
});

