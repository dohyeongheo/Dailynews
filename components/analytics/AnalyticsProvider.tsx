"use client";

/**
 * Analytics Provider 컴포넌트
 * 세션 관리 및 페이지뷰 자동 추적
 */

import { createContext, useContext, useEffect, useState, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getSessionId, getClientInfo, parseDeviceInfo } from '@/lib/utils/analytics';
import { clientLog } from '@/lib/utils/client-logger';

interface AnalyticsContextValue {
  sessionId: string;
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => void;
  trackPageView: (pagePath?: string, pageTitle?: string) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

function AnalyticsProviderInner({ children }: AnalyticsProviderProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lastPagePath, setLastPagePath] = useState<string>('');

  // 세션 ID 초기화 및 서버에 세션 등록 (한 번만 실행)
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const id = getSessionId();
        setSessionId(id);
        clientLog.debug('Analytics 세션 초기화', { sessionId: id });

        // 서버에 세션 등록
        const clientInfo = getClientInfo();
        const deviceInfo = parseDeviceInfo(clientInfo.user_agent);
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

        const response = await fetch('/api/analytics/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            session_id: id,
            first_page_path: currentPath,
            referrer: clientInfo.referrer,
            user_agent: clientInfo.user_agent,
            device_type: deviceInfo.device_type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            screen_width: clientInfo.screen_width,
            screen_height: clientInfo.screen_height,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`세션 등록 실패: ${response.status} ${errorText}`);
        }

        clientLog.debug('세션 등록 성공', { sessionId: id });
      } catch (error) {
        // 세션 등록 실패는 조용히 처리 (사용자 경험에 영향 없음)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          clientLog.warn('세션 등록 실패 (네트워크 오류) - 계속 진행', {
            error: error instanceof Error ? error.message : String(error),
          });
        } else {
          clientLog.warn('세션 등록 실패 (계속 진행)', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 한 번만 실행

  // 페이지뷰 추적 함수
  const trackPageView = async (pagePath?: string, pageTitle?: string) => {
    if (!sessionId) {
      clientLog.warn('세션 ID가 없어 페이지뷰를 추적할 수 없습니다.');
      return;
    }

    const currentPath = pagePath || pathname || '/';
    const currentTitle = pageTitle || (typeof document !== 'undefined' ? document.title : '');

    // 같은 페이지면 추적하지 않음 (리렌더링 방지)
    if (currentPath === lastPagePath) {
      return;
    }

    setLastPagePath(currentPath);

    try {
      const clientInfo = getClientInfo();
      const deviceInfo = parseDeviceInfo(clientInfo.user_agent);

      const response = await fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          page_path: currentPath,
          page_title: currentTitle,
          referrer: clientInfo.referrer,
          user_agent: clientInfo.user_agent,
          screen_width: clientInfo.screen_width,
          screen_height: clientInfo.screen_height,
          device_type: deviceInfo.device_type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`페이지뷰 추적 실패: ${response.status} ${errorText}`);
      }

      clientLog.debug('페이지뷰 추적 성공', { pagePath: currentPath });
    } catch (error) {
      // 네트워크 오류는 조용히 처리 (사용자 경험에 영향 없음)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        clientLog.warn('페이지뷰 추적 실패 (네트워크 오류)', { pagePath: currentPath });
      } else {
        clientLog.error('페이지뷰 추적 실패', error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  // 이벤트 추적 함수
  const trackEvent = async (
    eventName: string,
    metadata?: Record<string, unknown> & { event_type?: 'click' | 'search' | 'bookmark' | 'comment' | 'reaction' | 'share' | 'scroll' | 'custom' }
  ) => {
    const eventType = metadata?.event_type || 'custom';
    const { event_type, ...restMetadata } = metadata || {};
    if (!sessionId) {
      clientLog.warn('세션 ID가 없어 이벤트를 추적할 수 없습니다.');
      return;
    }

    try {
      const currentPath = pathname || '/';

      const response = await fetch('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventType,
          event_name: eventName,
          page_path: currentPath,
          metadata: restMetadata || {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`이벤트 추적 실패: ${response.status} ${errorText}`);
      }

      clientLog.debug('이벤트 추적 성공', { eventName, metadata });
    } catch (error) {
      // 네트워크 오류는 조용히 처리 (사용자 경험에 영향 없음)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        clientLog.warn('이벤트 추적 실패 (네트워크 오류)', { eventName });
      } else {
        clientLog.error('이벤트 추적 실패', error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  // 페이지 변경 시 자동 추적
  useEffect(() => {
    if (!sessionId) return;

    // 약간의 지연을 두어 페이지 로드 완료 후 추적
    const timer = setTimeout(() => {
      trackPageView();
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, sessionId]);

  // 페이지 언마운트 시 체류 시간 계산 (선택사항)
  useEffect(() => {
    if (!sessionId || !pathname) return;

    const startTime = Date.now();

    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000); // 초 단위
      if (duration > 0) {
        // 체류 시간 업데이트는 서버 사이드에서 처리
        // 여기서는 로컬 스토리지에 저장하여 다음 페이지뷰에서 전송
        const storageKey = `page_view_duration_${pathname}`;
        localStorage.setItem(storageKey, duration.toString());
      }
    };
  }, [pathname, sessionId]);

  const value: AnalyticsContextValue = {
    sessionId,
    trackEvent,
    trackPageView,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return (
    <Suspense fallback={children}>
      <AnalyticsProviderInner>{children}</AnalyticsProviderInner>
    </Suspense>
  );
}

/**
 * Analytics Context Hook
 */
export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

