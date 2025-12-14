import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserBookmarks } from "@/lib/db/bookmarks";
import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import Link from "next/link";

export default async function BookmarksPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const bookmarks = await getUserBookmarks(session.user.id, 50, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">내 북마크</h1>
          <p className="text-sm sm:text-base text-gray-600">저장한 뉴스를 확인하세요 ({bookmarks.length}개)</p>
        </div>

        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">북마크가 없습니다</h3>
            <p className="text-sm text-gray-500 mb-4">관심 있는 뉴스를 북마크하여 나중에 쉽게 찾아보세요.</p>
            <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              뉴스 보러가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {bookmarks.map((bookmark: any) => {
              // 북마크 데이터 구조: Supabase join으로 news 객체가 포함됨
              const news = bookmark.news || bookmark;
              if (!news || !news.id) {
                return null; // 뉴스 데이터가 없으면 렌더링하지 않음
              }
              return <NewsCard key={bookmark.id} news={news} showOriginalLink={true} initialBookmarked={true} />;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
