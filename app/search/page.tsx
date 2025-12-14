import { searchNewsAction } from "@/lib/actions";
import NewsCard from "@/components/NewsCard";

interface SearchPageProps {
  searchParams: {
    q?: string;
    type?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";
  const searchType = (searchParams.type as "title" | "content" | "all") || "all";

  let searchResults = null;
  if (query) {
    searchResults = await searchNewsAction(query, searchType, 1000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">검색 결과</h1>
          {query && (
            <p className="text-sm sm:text-base text-gray-600">
              &quot;{query}&quot; 검색 결과
              {searchType === "title" && " (제목)"}
              {searchType === "content" && " (내용)"}
              {searchType === "all" && " (제목 + 내용)"}
            </p>
          )}
        </div>

        {!query ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-gray-500">검색어를 입력해주세요.</p>
          </div>
        ) : searchResults && searchResults.success && searchResults.data ? (
          searchResults.data.length > 0 ? (
            <>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">총 {searchResults.data.length}개의 뉴스를 찾았습니다.</p>
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {searchResults.data.map((news) => (
                  <NewsCard key={news.id} news={news} showOriginalLink={false} />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 text-center">
              <p className="text-sm sm:text-base text-gray-500">&quot;{query}&quot;에 대한 검색 결과가 없습니다.</p>
            </div>
          )
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-gray-500">검색 중 오류가 발생했습니다.</p>
            {searchResults?.error && <p className="text-red-500 text-xs sm:text-sm mt-2">{searchResults.error}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
