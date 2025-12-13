/**
 * 로딩 스켈레톤 UI 컴포넌트
 */

export default function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <div className="h-5 w-16 bg-gray-200 rounded"></div>
            <div className="h-5 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>

      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

/**
 * 뉴스 리스트 로딩 스켈레톤
 */
export function NewsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} />
      ))}
    </div>
  );
}

