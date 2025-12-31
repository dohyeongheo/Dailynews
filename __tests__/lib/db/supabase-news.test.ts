/**
 * supabase-news 모듈 테스트
 */

// Supabase 클라이언트는 모킹이 필요합니다.
// 실제 데이터베이스 연결 없이 테스트하기 위해 jest.mock을 사용합니다.

jest.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        gte: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        limit: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'new-news-id' }, error: null })),
        })),
      })),
    })),
  },
}));

describe('supabase-news', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getNewsByCategory는 빈 배열을 반환해야 함 (모킹된 응답)', async () => {
    // 모킹된 Supabase 클라이언트는 빈 배열을 반환하도록 설정되어 있습니다.
    const { getNewsByCategory } = await import('@/lib/db/supabase-news');
    const result = await getNewsByCategory('태국뉴스', 10, 0);
    expect(Array.isArray(result)).toBe(true);
  });

  describe('insertNews - 중복 체크', () => {
    it('유사한 뉴스가 없는 경우 저장되어야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;

      // 유사도 체크: 최근 7일간 같은 카테고리 뉴스 조회 - 없음
      const mockSelect = jest.fn(() => ({
        gte: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      // insert 성공
      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'new-news-id' }, error: null })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });

      const { insertNews } = await import('@/lib/db/supabase-news');
      const result = await insertNews({
        published_date: '2025-01-01',
        source_country: '태국',
        source_media: '테스트 매체',
        title: '테스트 뉴스',
        content: '테스트 내용',
        category: '태국뉴스',
      });

      expect(result.success).toBe(true);
    });

    it('유사한 뉴스가 있는 경우 중복으로 처리되어야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;

      // 유사도 체크: 최근 7일간 같은 카테고리 뉴스 조회 - 유사한 뉴스 발견
      const mockSelect = jest.fn(() => ({
        gte: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: 'existing-news-id',
                    title: '테스트 뉴스', // 동일한 제목
                    content: '테스트 내용', // 동일한 내용
                    published_date: '2025-01-01',
                  },
                ],
                error: null,
              })
            ),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      const { insertNews } = await import('@/lib/db/supabase-news');
      const result = await insertNews({
        published_date: '2025-01-01',
        source_country: '태국',
        source_media: '테스트 매체',
        title: '테스트 뉴스', // 동일한 제목
        content: '테스트 내용', // 동일한 내용
        category: '태국뉴스',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('이미 존재하는 뉴스입니다.');
    });

    it('유사도가 75% 미만인 경우 저장되어야 함', async () => {
      const { supabaseServer } = await import('@/lib/supabase/server');
      const mockFrom = supabaseServer.from as jest.Mock;

      // 유사도 체크: 최근 7일간 같은 카테고리 뉴스 조회 - 다른 뉴스 (유사도 낮음)
      const mockSelect = jest.fn(() => ({
        gte: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: 'existing-news-id',
                    title: '완전히 다른 뉴스',
                    content: '완전히 다른 내용입니다.',
                    published_date: '2025-01-01',
                  },
                ],
                error: null,
              })
            ),
          })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });

      // insert 성공
      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'new-news-id' }, error: null })),
        })),
      }));
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });

      const { insertNews } = await import('@/lib/db/supabase-news');
      const result = await insertNews({
        published_date: '2025-01-01',
        source_country: '태국',
        source_media: '테스트 매체',
        title: '새로운 테스트 뉴스',
        content: '새로운 테스트 내용',
        category: '태국뉴스',
      });

      expect(result.success).toBe(true);
    });
  });

  // 실제 데이터베이스 연동 테스트는 통합 테스트에서 수행해야 합니다.
});
