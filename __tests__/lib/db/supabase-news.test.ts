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
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('supabase-news', () => {
  // 실제 Supabase 연결이 필요한 함수들은 통합 테스트에서 다루어야 합니다.
  // 단위 테스트에서는 모킹된 클라이언트를 사용하여 로직만 테스트합니다.

  test('getNewsByCategory는 빈 배열을 반환해야 함 (모킹된 응답)', async () => {
    // 모킹된 Supabase 클라이언트는 빈 배열을 반환하도록 설정되어 있습니다.
    const { getNewsByCategory } = await import('@/lib/db/supabase-news');
    const result = await getNewsByCategory('태국뉴스', 10, 0);
    expect(Array.isArray(result)).toBe(true);
  });

  // 실제 데이터베이스 연동 테스트는 통합 테스트에서 수행해야 합니다.
});

