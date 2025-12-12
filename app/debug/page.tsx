import { getNewsByCategoryAction, getAllNewsAction } from '@/lib/actions';
import Header from '@/components/Header';

export default async function DebugPage() {
  const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 모든 카테고리별 데이터 조회
  const [thailandNews, relatedNews, koreaNews, allNews] = await Promise.all([
    getNewsByCategoryAction('태국뉴스', 100),
    getNewsByCategoryAction('관련뉴스', 100),
    getNewsByCategoryAction('한국뉴스', 100),
    getAllNewsAction(100),
  ]);

  // 환경 변수 확인 (민감한 정보는 일부만 표시)
  const envInfo = {
    useSupabase,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
      : '없음',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">디버그 정보</h1>
        </div>

        {/* 환경 변수 정보 */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">환경 변수 상태</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Supabase 사용:</span>{' '}
              {envInfo.useSupabase ? '✅ 예' : '❌ 아니오'}
            </p>
            <p>
              <span className="font-medium">Supabase URL:</span> {envInfo.supabaseUrl}
            </p>
            <p>
              <span className="font-medium">Supabase Anon Key:</span>{' '}
              {envInfo.hasSupabaseAnonKey ? '✅ 설정됨' : '❌ 없음'}
            </p>
            <p>
              <span className="font-medium">Service Role Key:</span>{' '}
              {envInfo.hasServiceRoleKey ? '✅ 설정됨' : '❌ 없음'}
            </p>
          </div>
        </div>

        {/* 데이터 통계 */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">데이터 통계</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">태국뉴스:</span>
              <span>
                {thailandNews.success
                  ? `${thailandNews.data?.length || 0}개`
                  : `❌ ${thailandNews.error}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">관련뉴스:</span>
              <span>
                {relatedNews.success
                  ? `${relatedNews.data?.length || 0}개`
                  : `❌ ${relatedNews.error}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">한국뉴스:</span>
              <span>
                {koreaNews.success
                  ? `${koreaNews.data?.length || 0}개`
                  : `❌ ${koreaNews.error}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">전체 뉴스:</span>
              <span>
                {allNews.success
                  ? `${allNews.data?.length || 0}개`
                  : `❌ ${allNews.error}`}
              </span>
            </div>
          </div>
        </div>

        {/* 카테고리별 샘플 데이터 */}
        {thailandNews.success && thailandNews.data && thailandNews.data.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">태국뉴스 샘플 (최대 3개)</h2>
            <div className="space-y-3">
              {thailandNews.data.slice(0, 3).map((news) => (
                <div key={news.id} className="p-3 bg-gray-50 rounded">
                  <p className="font-medium text-sm">ID: {news.id}</p>
                  <p className="text-sm">제목: {news.title}</p>
                  <p className="text-xs text-gray-500">카테고리: {news.category}</p>
                  <p className="text-xs text-gray-500">생성일: {news.created_at}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 실제 저장된 카테고리 값 확인 */}
        {allNews.success && allNews.data && allNews.data.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">저장된 카테고리 값 (고유값)</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(allNews.data.map((n) => n.category))).map((cat) => (
                <span key={cat} className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

