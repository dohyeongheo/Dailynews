/**
 * 페이지뷰 추적 Hook
 * Next.js App Router의 usePathname, useSearchParams를 활용
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';

/**
 * 페이지뷰 자동 추적 Hook
 * 페이지 변경 시 자동으로 페이지뷰를 추적합니다.
 */
export function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView } = useAnalytics();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    // 쿼리 파라미터를 포함한 전체 경로
    const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    // 경로가 변경되었을 때만 추적
    if (fullPath !== lastPathRef.current) {
      lastPathRef.current = fullPath;

      // 페이지 로드 완료 후 추적
      const timer = setTimeout(() => {
        trackPageView();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, trackPageView]);
}





